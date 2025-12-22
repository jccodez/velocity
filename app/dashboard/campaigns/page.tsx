"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { getCampaignsByBusinessId, Campaign } from "@/lib/firebase/campaigns";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { Plus, Briefcase, Trash2, Edit, Play, Pause } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    try {
      const businesses = await getBusinessesByUserId(user.uid);
      let allCampaigns: Campaign[] = [];
      for (const business of businesses) {
        if (business.id) {
          const businessCampaigns = await getCampaignsByBusinessId(business.id);
          allCampaigns = [...allCampaigns, ...businessCampaigns];
        }
      }
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading campaigns...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-2">
            Manage your social media campaigns
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No campaigns yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first campaign to start managing social media posts.
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {campaign.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {campaign.name}
              </h3>
              {campaign.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {campaign.description}
                </p>
              )}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={`/dashboard/campaigns/${campaign.id}`}
                className="block mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

