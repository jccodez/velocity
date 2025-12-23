"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { getPostsByBusinessId, SocialPost } from "@/lib/firebase/posts";
import { getAnalyticsByBusinessId, PostAnalytics } from "@/lib/firebase/analytics";
import { Building2, TrendingUp, Heart, MessageCircle, Share2, Eye, MousePointerClick, BarChart3, FileText } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [analytics, setAnalytics] = useState<PostAnalytics[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBusinessId) {
      loadAnalytics();
    }
  }, [selectedBusinessId, user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userBusinesses = await getBusinessesByUserId(user.uid);
      setBusinesses(userBusinesses);
      if (userBusinesses.length > 0) {
        setSelectedBusinessId(userBusinesses[0].id || "");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedBusinessId || !user) return;
    try {
      const [postsData, analyticsData] = await Promise.all([
        getPostsByBusinessId(selectedBusinessId),
        getAnalyticsByBusinessId(selectedBusinessId),
      ]);
      setPosts(postsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const refreshAnalytics = async () => {
    if (!selectedBusinessId) return;
    setRefreshing(true);
    try {
      // Get all published posts and refresh their analytics
      const publishedPosts = posts.filter(p => p.status === "published" && p.facebookPostId);
      
      for (const post of publishedPosts) {
        if (post.id && post.facebookPostId) {
          try {
            const { getFacebookConnection } = await import("@/lib/firebase/facebook");
            const connection = await getFacebookConnection(post.businessId);
            if (connection?.accessToken && connection?.pageId) {
              await fetch("/api/analytics/fetch-facebook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  postId: post.id,
                  facebookPostId: post.facebookPostId,
                  accessToken: connection.accessToken,
                  pageId: connection.pageId,
                  businessId: post.businessId,
                }),
              });
            }
          } catch (error) {
            console.error(`Error refreshing analytics for post ${post.id}:`, error);
          }
        }
      }
      
      // Reload analytics after a short delay
      setTimeout(() => {
        loadAnalytics();
        setRefreshing(false);
      }, 2000);
    } catch (error) {
      console.error("Error refreshing analytics:", error);
      setRefreshing(false);
    }
  };

  // Calculate aggregate metrics
  const metrics = {
    totalPosts: posts.filter(p => p.status === "published").length,
    totalLikes: analytics.reduce((sum, a) => sum + (a.likes || 0), 0),
    totalComments: analytics.reduce((sum, a) => sum + (a.comments || 0), 0),
    totalShares: analytics.reduce((sum, a) => sum + (a.shares || 0), 0),
    totalImpressions: analytics.reduce((sum, a) => sum + (a.impressions || 0), 0),
    totalReach: analytics.reduce((sum, a) => sum + (a.reach || 0), 0),
    totalClicks: analytics.reduce((sum, a) => sum + (a.clicks || 0), 0),
    avgEngagement: analytics.length > 0
      ? analytics.reduce((sum, a) => sum + (a.engagement || 0), 0) / analytics.length
      : 0,
  };

  // Get top performing posts
  const topPosts = [...analytics]
    .sort((a, b) => {
      const engagementA = (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
      const engagementB = (b.likes || 0) + (b.comments || 0) + (b.shares || 0);
      return engagementB - engagementA;
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses yet</h3>
        <p className="text-gray-600 mb-6">Create a business to start tracking analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track performance and engagement for your social media posts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
          <button
            onClick={refreshAnalytics}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {refreshing ? "Refreshing..." : "Refresh Analytics"}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Posts</span>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalPosts}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Likes</span>
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalLikes.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Comments</span>
            <MessageCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalComments.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Shares</span>
            <Share2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalShares.toLocaleString()}</p>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Impressions</span>
            <Eye className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalImpressions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Reach</span>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalReach.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Avg Engagement Rate</span>
            <BarChart3 className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.avgEngagement > 0 ? `${metrics.avgEngagement.toFixed(2)}%` : "N/A"}
          </p>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Performing Posts</h2>
        {topPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No analytics data yet. Publish some posts to see performance metrics.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topPosts.map((analyticsItem) => {
              const post = posts.find(p => p.id === analyticsItem.postId);
              const totalEngagement = (analyticsItem.likes || 0) + (analyticsItem.comments || 0) + (analyticsItem.shares || 0);
              return (
                <div
                  key={analyticsItem.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                        {post?.content || "Post content not available"}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          {analyticsItem.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          {analyticsItem.comments || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-4 h-4 text-green-500" />
                          {analyticsItem.shares || 0}
                        </span>
                        {analyticsItem.impressions && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-purple-500" />
                            {analyticsItem.impressions.toLocaleString()}
                          </span>
                        )}
                        {analyticsItem.engagement && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            {analyticsItem.engagement.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-2xl font-bold text-blue-600">{totalEngagement}</p>
                      <p className="text-xs text-gray-500">Total Engagement</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Posts with Analytics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Posts Performance</h2>
        {posts.filter(p => p.status === "published").length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No published posts yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts
              .filter(p => p.status === "published")
              .map((post) => {
                const postAnalytics = analytics.find(a => a.postId === post.id);
                return (
                  <div
                    key={post.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {postAnalytics ? (
                            <>
                              <span>❤️ {postAnalytics.likes || 0}</span>
                              <span>💬 {postAnalytics.comments || 0}</span>
                              <span>🔗 {postAnalytics.shares || 0}</span>
                              {postAnalytics.impressions && (
                                <span>👁️ {postAnalytics.impressions.toLocaleString()}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Analytics not available</span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="ml-4 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

