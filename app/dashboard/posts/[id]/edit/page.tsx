"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getPostById, updatePost, SocialPost } from "@/lib/firebase/posts";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { generatePostContent } from "@/lib/ai/contentGenerator";
import { Business } from "@/lib/firebase/businesses";
import { Timestamp } from "firebase/firestore";
import { Sparkles, ArrowLeft, Calendar, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";

const PLATFORMS = ["facebook", "instagram", "twitter", "linkedin"];

export default function EditPostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [formData, setFormData] = useState({
    businessId: "",
    platform: "facebook",
    content: "",
    topic: "",
    scheduledDate: "",
    scheduledTime: "",
  });
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [originalPost, setOriginalPost] = useState<SocialPost | null>(null);

  useEffect(() => {
    if (user && postId) {
      loadData();
    }
  }, [user, postId]);

  const loadData = async () => {
    if (!user || !postId) return;
    try {
      // Load businesses and post in parallel
      const [businessesData, post] = await Promise.all([
        getBusinessesByUserId(user.uid),
        getPostById(postId),
      ]);

      if (!post) {
        alert("Post not found");
        router.push("/dashboard/posts");
        return;
      }

      setBusinesses(businessesData);
      setOriginalPost(post);
      setIsAiGenerated(post.aiGenerated || false);

      // Convert scheduledDate Timestamp to date/time strings
      let scheduledDateStr = "";
      let scheduledTimeStr = "";
      if (post.scheduledDate && post.scheduledDate instanceof Timestamp) {
        const scheduledDateObj = post.scheduledDate.toDate();
        scheduledDateStr = scheduledDateObj.toISOString().split("T")[0];
        scheduledTimeStr = scheduledDateObj.toTimeString().slice(0, 5); // HH:mm format
      }

      setFormData({
        businessId: post.businessId || "",
        platform: post.platform || "facebook",
        content: post.content || "",
        topic: "", // Topic is not stored, it's only used for generation
        scheduledDate: scheduledDateStr,
        scheduledTime: scheduledTimeStr,
      });
    } catch (error) {
      console.error("Error loading post:", error);
      alert("Failed to load post");
      router.push("/dashboard/posts");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!formData.businessId) {
      alert("Please select a business first");
      return;
    }

    const business = businesses.find((b) => b.id === formData.businessId);
    if (!business) return;

    setGenerating(true);
    setIsAiGenerated(true);
    try {
      const generated = await generatePostContent({
        businessName: business.name,
        businessDescription: business.description,
        toneOfVoice: business.toneOfVoice,
        platform: formData.platform,
        topic: formData.topic || undefined,
        includeCallToAction: true,
      });
      setFormData((prev) => ({ ...prev, content: generated.content }));
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Failed to generate content");
      setIsAiGenerated(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postId || !formData.businessId) return;

    setSaving(true);
    try {
      let scheduledTimestamp: Timestamp | undefined;
      let newStatus: "draft" | "scheduled" | "published" | "failed" = originalPost?.status || "draft";

      if (formData.scheduledDate && formData.scheduledTime) {
        const scheduledDateTime = new Date(
          `${formData.scheduledDate}T${formData.scheduledTime}`
        );
        scheduledTimestamp = Timestamp.fromDate(scheduledDateTime);
        // If scheduling, set status to scheduled (unless already published)
        if (originalPost?.status !== "published") {
          newStatus = "scheduled";
        }
      } else if (formData.scheduledDate || formData.scheduledTime) {
        // If only one is set, don't schedule
        alert("Please provide both date and time to schedule, or leave both empty for draft");
        setSaving(false);
        return;
      } else {
        // If no date/time, set to draft (unless already published)
        if (originalPost?.status !== "published") {
          newStatus = "draft";
        }
      }

      const updates: Partial<SocialPost> = {
        content: formData.content,
        businessId: formData.businessId,
        platform: formData.platform,
        status: newStatus,
        aiGenerated: isAiGenerated,
      };

      // Handle scheduledDate: update if provided, or remove if cleared
      if (scheduledTimestamp) {
        updates.scheduledDate = scheduledTimestamp;
      } else if (originalPost?.scheduledDate && (!formData.scheduledDate && !formData.scheduledTime)) {
        // Both date and time are cleared, so we'll need to remove scheduledDate
        // We'll handle this by passing a special marker that updatePost will recognize
        (updates as any).__deleteScheduledDate = true;
      }

      await updatePost(postId, updates);
      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to create a business first before editing posts.{" "}
            <Link href="/dashboard/businesses/new" className="underline">
              Create a business →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard/posts"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Posts
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
        <p className="text-gray-600 mt-2">
          Update your social media post
        </p>
        {originalPost?.status === "published" && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              ⚠️ This post has already been published. You can edit it, but changing the schedule won&apos;t affect the published version.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business *
          </label>
          <select
            required
            value={formData.businessId}
            onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Select a business</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform *
          </label>
          <select
            required
            value={formData.platform}
            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none capitalize"
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic (Optional)
          </label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="e.g., New product launch, Special offer, Company news..."
          />
          <p className="text-xs text-gray-500 mt-1">
            What should this post be about? This helps AI generate more relevant content.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Content *
            </label>
            <button
              type="button"
              onClick={handleGenerateContent}
              disabled={generating || !formData.businessId}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? "Generating..." : "Regenerate with AI"}
            </button>
          </div>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Write your post content here, or click 'Regenerate with AI' to create it automatically..."
          />
          <p className="text-xs text-gray-500 mt-2">
            {formData.content.length} characters
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Time (Optional)
            </label>
            <input
              type="time"
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/dashboard/posts"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

