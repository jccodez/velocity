"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { createPost } from "@/lib/firebase/posts";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { generatePostContent } from "@/lib/ai/contentGenerator";
import { Business } from "@/lib/firebase/businesses";
import { Timestamp } from "firebase/firestore";
import { Sparkles, ArrowLeft, Calendar, Image as ImageIcon, Upload, Wand2, X, Loader2 } from "lucide-react";
import Link from "next/link";

const PLATFORMS = ["facebook", "instagram", "twitter", "linkedin"];

export default function NewPostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [formData, setFormData] = useState({
    businessId: "",
    platform: "facebook",
    content: "",
    topic: "",
    scheduledDate: "",
    scheduledTime: "",
  });

  useEffect(() => {
    if (user) {
      loadBusinesses();
    }
  }, [user]);

  const loadBusinesses = async () => {
    if (!user) return;
    try {
      const data = await getBusinessesByUserId(user.uid);
      setBusinesses(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, businessId: data[0].id || "" }));
      }
    } catch (error) {
      console.error("Error loading businesses:", error);
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
      // Reset input
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
    if (!user || !formData.businessId) return;

    setLoading(true);
    try {
      let scheduledTimestamp;
      if (formData.scheduledDate && formData.scheduledTime) {
        // Create date in UTC to avoid timezone issues
        // Format: YYYY-MM-DDTHH:mm (local time, will be interpreted as UTC)
        const dateTimeString = `${formData.scheduledDate}T${formData.scheduledTime}:00`;
        // Explicitly create as UTC to avoid local timezone interpretation
        const [year, month, day] = formData.scheduledDate.split('-').map(Number);
        const [hours, minutes] = formData.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
        scheduledTimestamp = Timestamp.fromDate(scheduledDateTime);
      }

      const postData: any = {
        content: formData.content,
        businessId: formData.businessId,
        platform: formData.platform,
        status: scheduledTimestamp ? "scheduled" : "draft",
        aiGenerated: isAiGenerated,
        userId: user.uid,
      };

      // Only include scheduledDate if it exists
      if (scheduledTimestamp) {
        postData.scheduledDate = scheduledTimestamp;
      }

      // Include media URLs if any
      if (mediaUrls.length > 0) {
        postData.mediaUrls = mediaUrls;
      }

      await createPost(postData);
      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  if (businesses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to create a business first before creating posts.{" "}
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
        <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600 mt-2">
          Create a new social media post for your business
        </p>
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
              {generating ? "Generating..." : "Generate with AI"}
            </button>
          </div>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Write your post content here, or click 'Generate with AI' to create it automatically..."
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
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating..." : formData.scheduledDate ? "Schedule Post" : "Save as Draft"}
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

