"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { createCampaign } from "@/lib/firebase/campaigns";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { Business } from "@/lib/firebase/businesses";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

const PLATFORMS = ["facebook", "instagram", "twitter", "linkedin"];

export default function NewCampaignPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [formData, setFormData] = useState({
    businessId: "",
    name: "",
    description: "",
    status: "draft" as "draft" | "active" | "paused" | "completed",
    platforms: [] as string[],
    startDate: "",
    endDate: "",
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

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.businessId || formData.platforms.length === 0) {
      alert("Please fill in all required fields and select at least one platform");
      return;
    }

    setLoading(true);
    try {
      const { Timestamp } = await import("firebase/firestore");
      let startTimestamp, endTimestamp;
      
      if (formData.startDate) {
        startTimestamp = Timestamp.fromDate(new Date(formData.startDate));
      }
      if (formData.endDate) {
        endTimestamp = Timestamp.fromDate(new Date(formData.endDate));
      }

      await createCampaign({
        name: formData.name,
        description: formData.description || undefined,
        businessId: formData.businessId,
        status: formData.status,
        platforms: formData.platforms,
        startDate: startTimestamp,
        endDate: endTimestamp,
        posts: [],
        userId: user.uid,
      });
      router.push("/dashboard/campaigns");
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  if (businesses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to create a business first before creating campaigns.{" "}
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
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="text-gray-600 mt-2">
          Create a new campaign to organize your social media posts
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
            Campaign Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Summer 2025 Campaign"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Describe your campaign goals and objectives..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Platforms * (Select at least one)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors capitalize ${
                  formData.platforms.includes(platform)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <select
            required
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as typeof formData.status,
              })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none capitalize"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
          <Link
            href="/dashboard/campaigns"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

