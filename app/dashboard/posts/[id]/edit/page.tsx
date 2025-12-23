"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getPostById, updatePost, SocialPost } from "@/lib/firebase/posts";
import { getFacebookConnection } from "@/lib/firebase/facebook";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { getCampaignsByBusinessId, Campaign, updateCampaign, getCampaignById } from "@/lib/firebase/campaigns";
import { generatePostContent } from "@/lib/ai/contentGenerator";
import { Business } from "@/lib/firebase/businesses";
import { Timestamp } from "firebase/firestore";
import { Sparkles, ArrowLeft, Calendar, Image as ImageIcon, Loader2, Send, Upload, Wand2, X } from "lucide-react";
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [formData, setFormData] = useState({
    businessId: "",
    campaignId: "",
    platform: "facebook",
    content: "",
    topic: "",
    scheduledDate: "",
    scheduledTime: "",
  });
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [originalPost, setOriginalPost] = useState<SocialPost | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");

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
        campaignId: post.campaignId || "",
        platform: post.platform || "facebook",
        content: post.content || "",
        topic: "", // Topic is not stored, it's only used for generation
        scheduledDate: scheduledDateStr,
        scheduledTime: scheduledTimeStr,
      });
      setMediaUrls(post.mediaUrls || []);
      
      // Load campaigns for the business
      if (post.businessId) {
        await loadCampaigns(post.businessId);
      }
    } catch (error) {
      console.error("Error loading post:", error);
      alert("Failed to load post");
      router.push("/dashboard/posts");
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async (businessId: string) => {
    if (!businessId) return;
    try {
      const data = await getCampaignsByBusinessId(businessId);
      // Filter to only show active or draft campaigns
      setCampaigns(data.filter(c => c.status === "active" || c.status === "draft"));
    } catch (error) {
      console.error("Error loading campaigns:", error);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("userId", user.uid);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setMediaUrls((prev) => [...prev, data.url]);
      alert("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      alert("Please enter a prompt for the image");
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          size: "1024x1024",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      // Image is already uploaded to Firebase Storage by the API route
      // Just use the returned URL directly
      setMediaUrls((prev) => [...prev, data.url]);
      setImagePrompt("");
      alert("Image generated and uploaded successfully!");
    } catch (error: any) {
      console.error("Error generating image:", error);
      alert(error.message || "Failed to generate image");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postId || !formData.businessId) return;

    setSaving(true);
    try {
      let scheduledTimestamp: Timestamp | undefined;
      let newStatus: "draft" | "scheduled" | "published" | "failed" = originalPost?.status || "draft";

      if (formData.scheduledDate && formData.scheduledTime) {
        // Create date in UTC to avoid timezone issues
        const [year, month, day] = formData.scheduledDate.split('-').map(Number);
        const [hours, minutes] = formData.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
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

      // Include campaignId
      if (formData.campaignId) {
        updates.campaignId = formData.campaignId;
      } else if (originalPost?.campaignId) {
        // If campaign was removed, clear it
        updates.campaignId = undefined;
      }

      // Include media URLs
      if (mediaUrls.length > 0) {
        updates.mediaUrls = mediaUrls;
      } else {
        // If no media URLs, explicitly set to empty array to clear existing ones
        updates.mediaUrls = [];
      }

      await updatePost(postId, updates);

      // Update campaign posts array if campaign changed
      const oldCampaignId = originalPost?.campaignId;
      const newCampaignId = formData.campaignId || undefined;
      
      if (oldCampaignId !== newCampaignId) {
        try {
          // Remove from old campaign if it existed
          if (oldCampaignId) {
            const oldCampaign = await getCampaignById(oldCampaignId);
            if (oldCampaign && oldCampaign.id) {
              const updatedPosts = (oldCampaign.posts || []).filter(id => id !== postId);
              await updateCampaign(oldCampaign.id, { posts: updatedPosts });
            }
          }
          
          // Add to new campaign if selected
          if (newCampaignId) {
            const newCampaign = await getCampaignById(newCampaignId);
            if (newCampaign && newCampaign.id) {
              const updatedPosts = [...(newCampaign.posts || []), postId];
              await updateCampaign(newCampaign.id, { posts: updatedPosts });
            }
          }
        } catch (error) {
          console.error("Error updating campaign with post:", error);
          // Don't fail the post update if campaign update fails
        }
      }
      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!postId || !originalPost) return;
    
    setPublishing(true);
    try {
      // Check if already published
      if (originalPost.status === "published") {
        alert("Post is already published");
        setPublishing(false);
        return;
      }

      // Get Facebook connection (client-side has auth)
      const facebookConnection = await getFacebookConnection(originalPost.businessId);
      if (!facebookConnection || !facebookConnection.accessToken) {
        alert("No Facebook connection found. Please connect Facebook for this business first.");
        setPublishing(false);
        return;
      }

      const pageId = facebookConnection.pageId || facebookConnection.businessId;
      if (!pageId) {
        alert("No Facebook page ID found");
        setPublishing(false);
        return;
      }

      // Call API to publish to Facebook (server-side for security)
      // Pass all needed data so API doesn't need to read Firestore
      const response = await fetch("/api/posts/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          businessId: originalPost.businessId,
          content: formData.content || originalPost.content,
          platform: formData.platform || originalPost.platform,
          pageId: pageId,
          accessToken: facebookConnection.accessToken,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : (originalPost.mediaUrls || []),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Update post status to failed on client-side
        await updatePost(postId, {
          status: "failed",
          failureReason: data.error || "Failed to publish post",
        });
        alert(data.error || "Failed to publish post");
        return;
      }

      // Update post status to published on client-side (has user auth)
      await updatePost(postId, {
        status: "published",
        publishedDate: Timestamp.now(),
      });

      // Redirect to posts page
      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Error publishing post:", error);
      alert("Failed to publish post");
    } finally {
      setPublishing(false);
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
            onChange={async (e) => {
              const newBusinessId = e.target.value;
              setFormData({ ...formData, businessId: newBusinessId, campaignId: "" });
              await loadCampaigns(newBusinessId);
            }}
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
            Campaign (Optional)
          </label>
          <select
            value={formData.campaignId}
            onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={!formData.businessId || campaigns.length === 0}
          >
            <option value="">No campaign</option>
            {campaigns
              .filter(c => c.platforms.includes(formData.platform) || formData.platform === "")
              .map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} {campaign.status !== "active" ? `(${campaign.status})` : ""}
                </option>
              ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {!formData.businessId 
              ? "Select a business first to see campaigns"
              : campaigns.length === 0 
              ? "No active or draft campaigns for this business"
              : "Only campaigns matching the selected platform are shown"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform *
          </label>
          <select
            required
            value={formData.platform}
            onChange={(e) => {
              const newPlatform = e.target.value;
              setFormData({ ...formData, platform: newPlatform });
              // Clear campaign if it doesn't support the new platform
              const selectedCampaign = campaigns.find(c => c.id === formData.campaignId);
              if (selectedCampaign && !selectedCampaign.platforms.includes(newPlatform)) {
                setFormData(prev => ({ ...prev, platform: newPlatform, campaignId: "" }));
              }
            }}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images (Optional)
          </label>
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-gray-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Upload Image</span>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* AI Image Generation */}
            <div className="flex gap-2">
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !generatingImage) {
                    handleGenerateImage();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={generatingImage || !imagePrompt.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>

            {/* Display Uploaded Images */}
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Upload images or generate them with AI. Images will be included when publishing to social media.
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
          {originalPost?.status !== "published" && (
            <button
              type="button"
              onClick={handlePublishNow}
              disabled={publishing || saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center gap-2"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post Now
                </>
              )}
            </button>
          )}
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

