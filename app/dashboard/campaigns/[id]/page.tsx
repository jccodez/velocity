"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getCampaignById, Campaign, updateCampaign, updateCampaignStatusByDates } from "@/lib/firebase/campaigns";
import { getPostsByCampaignId, SocialPost } from "@/lib/firebase/posts";
import { getBusinessById, Business } from "@/lib/firebase/businesses";
import { ArrowLeft, Briefcase, FileText, Calendar, TrendingUp, CheckCircle, Clock, Pause, Play } from "lucide-react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";

export default function CampaignDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (user && campaignId) {
      loadCampaignData();
    }
  }, [user, campaignId]);

  const loadCampaignData = async () => {
    if (!user || !campaignId) return;
    setLoading(true);
    try {
      console.log(`[Campaign Detail] Loading campaign ${campaignId} for user ${user.uid}`);
      
      // Load campaign first
      let campaignData;
      try {
        campaignData = await getCampaignById(campaignId);
        console.log(`[Campaign Detail] Campaign loaded:`, campaignData ? { id: campaignData.id, name: campaignData.name, userId: campaignData.userId, businessId: campaignData.businessId } : "null");
      } catch (campaignError: any) {
        console.error(`[Campaign Detail] Error loading campaign:`, campaignError);
        throw new Error(`Failed to load campaign: ${campaignError.message || campaignError.code || "Unknown error"}`);
      }

      if (!campaignData) {
        alert("Campaign not found");
        router.push("/dashboard/campaigns");
        return;
      }

      // Verify ownership
      if (campaignData.userId !== user.uid) {
        console.warn(`[Campaign Detail] User ${user.uid} does not own campaign ${campaignId} (owner: ${campaignData.userId})`);
        alert("You don't have permission to view this campaign");
        router.push("/dashboard/campaigns");
        return;
      }

      // Load posts (don't fail if this fails)
      let postsData: SocialPost[] = [];
      try {
        postsData = await getPostsByCampaignId(campaignId);
        console.log(`[Campaign Detail] Loaded ${postsData.length} post(s) for campaign`);
      } catch (postsError: any) {
        console.error(`[Campaign Detail] Error loading posts (non-fatal):`, postsError);
        // Continue without posts
      }

      // Auto-update campaign status based on dates (don't fail if this fails)
      try {
        const statusUpdate = await updateCampaignStatusByDates(campaignId);
        if (statusUpdate.updated && statusUpdate.newStatus) {
          console.log(`[Campaign Detail] Status updated from ${campaignData.status} to ${statusUpdate.newStatus}`);
          campaignData.status = statusUpdate.newStatus;
        }
      } catch (statusError: any) {
        console.error(`[Campaign Detail] Error updating status (non-fatal):`, statusError);
        // Continue without status update
      }

      setCampaign(campaignData);
      setPosts(postsData);

      // Load business (don't fail if this fails)
      if (campaignData.businessId) {
        try {
          const businessData = await getBusinessById(campaignData.businessId);
          console.log(`[Campaign Detail] Business loaded:`, businessData ? businessData.name : "null");
          setBusiness(businessData);
        } catch (businessError: any) {
          console.error(`[Campaign Detail] Error loading business (non-fatal):`, businessError);
          // Continue without business data
        }
      }
    } catch (error: any) {
      console.error("[Campaign Detail] Error loading campaign:", error);
      const errorMessage = error.message || "Failed to load campaign. Please check the console for details.";
      alert(errorMessage);
      router.push("/dashboard/campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Campaign["status"]) => {
    if (!campaign || !campaign.id) return;
    setUpdatingStatus(true);
    try {
      await updateCampaign(campaign.id, { status: newStatus });
      setCampaign({ ...campaign, status: newStatus });
    } catch (error) {
      console.error("Error updating campaign status:", error);
      alert("Failed to update campaign status");
    } finally {
      setUpdatingStatus(false);
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5" />;
      case "paused":
        return <Pause className="w-5 h-5" />;
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getPostStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate metrics
  const metrics = {
    totalPosts: posts.length,
    published: posts.filter(p => p.status === "published").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    draft: posts.filter(p => p.status === "draft").length,
    failed: posts.filter(p => p.status === "failed").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      {/* Campaign Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                {business && (
                  <p className="text-gray-600 mt-1">
                    Business: <Link href={`/dashboard/businesses/${business.id}`} className="text-blue-600 hover:underline">{business.name}</Link>
                  </p>
                )}
              </div>
            </div>
            {campaign.description && (
              <p className="text-gray-600 mb-4">{campaign.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(campaign.status)}`}>
              {getStatusIcon(campaign.status)}
              {campaign.status}
            </span>
            {campaign.status === "draft" && (
              <button
                onClick={() => handleStatusChange("active")}
                disabled={updatingStatus}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Activate
              </button>
            )}
            {campaign.status === "active" && (
              <button
                onClick={() => handleStatusChange("paused")}
                disabled={updatingStatus}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            {campaign.status === "paused" && (
              <button
                onClick={() => handleStatusChange("active")}
                disabled={updatingStatus}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500 mb-1">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {campaign.platforms.map((platform) => (
                <span
                  key={platform}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
          {campaign.startDate && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Start Date</p>
              <p className="text-gray-900 font-medium">
                {campaign.startDate instanceof Timestamp
                  ? campaign.startDate.toDate().toLocaleDateString()
                  : new Date(campaign.startDate).toLocaleDateString()}
              </p>
            </div>
          )}
          {campaign.endDate && (
            <div>
              <p className="text-sm text-gray-500 mb-1">End Date</p>
              <p className="text-gray-900 font-medium">
                {campaign.endDate instanceof Timestamp
                  ? campaign.endDate.toDate().toLocaleDateString()
                  : new Date(campaign.endDate).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Posts</p>
            <p className="text-gray-900 font-medium text-2xl">{metrics.totalPosts}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Published</p>
              <p className="text-2xl font-bold text-green-600">{metrics.published}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.scheduled}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Draft</p>
              <p className="text-2xl font-bold text-gray-600">{metrics.draft}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-600">{metrics.failed}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Posts ({posts.length})</h2>
          <Link
            href={`/dashboard/posts/new?campaignId=${campaignId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Add Post
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">
              Create posts and link them to this campaign to get started.
            </p>
            <Link
              href={`/dashboard/posts/new?campaignId=${campaignId}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              <FileText className="w-5 h-5" />
              Create First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPostStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">{post.platform}</span>
                      {post.aiGenerated && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          AI Generated
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 mb-2 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {post.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Scheduled: {post.scheduledDate instanceof Timestamp
                            ? post.scheduledDate.toDate().toLocaleString()
                            : new Date(post.scheduledDate).toLocaleString()}
                        </span>
                      )}
                      {post.publishedDate && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Published: {post.publishedDate instanceof Timestamp
                            ? post.publishedDate.toDate().toLocaleString()
                            : new Date(post.publishedDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {post.failureReason && (
                      <p className="text-xs text-red-600 mt-2">Error: {post.failureReason}</p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="ml-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

