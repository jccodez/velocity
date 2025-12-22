"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { getCampaignsByBusinessId } from "@/lib/firebase/campaigns";
import { getPostsByBusinessId } from "@/lib/firebase/posts";
import { Business } from "@/lib/firebase/businesses";
import { Campaign } from "@/lib/firebase/campaigns";
import { SocialPost } from "@/lib/firebase/posts";
import {
  Building2,
  Briefcase,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const userBusinesses = await getBusinessesByUserId(user.uid);
      setBusinesses(userBusinesses);

      // Get campaigns and posts for all businesses
      let allCampaigns: Campaign[] = [];
      let allPosts: SocialPost[] = [];

      for (const business of userBusinesses) {
        if (business.id) {
          const businessCampaigns = await getCampaignsByBusinessId(business.id);
          const businessPosts = await getPostsByBusinessId(business.id);
          allCampaigns = [...allCampaigns, ...businessCampaigns];
          allPosts = [...allPosts, ...businessPosts];
        }
      }

      setCampaigns(allCampaigns);
      setPosts(allPosts);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Businesses",
      value: businesses.length,
      icon: Building2,
      color: "bg-blue-500",
      href: "/dashboard/businesses",
    },
    {
      name: "Active Campaigns",
      value: campaigns.filter((c) => c.status === "active").length,
      icon: Briefcase,
      color: "bg-green-500",
      href: "/dashboard/campaigns",
    },
    {
      name: "Total Posts",
      value: posts.length,
      icon: FileText,
      color: "bg-purple-500",
      href: "/dashboard/posts",
    },
    {
      name: "Published Posts",
      value: posts.filter((p) => p.status === "published").length,
      icon: TrendingUp,
      color: "bg-orange-500",
      href: "/dashboard/posts?status=published",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here&apos;s an overview of your social media campaigns.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/businesses/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Add Business</span>
          </Link>
          <Link
            href="/dashboard/campaigns/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Create Campaign</span>
          </Link>
          <Link
            href="/dashboard/posts/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Create Post</span>
          </Link>
        </div>
      </div>

      {/* Recent Businesses */}
      {businesses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Businesses
            </h2>
            <Link
              href="/dashboard/businesses"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.slice(0, 6).map((business) => (
              <Link
                key={business.id}
                href={`/dashboard/businesses/${business.id}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-1">
                  {business.name}
                </h3>
                {business.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {business.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {businesses.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Get Started
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first business to start managing social media campaigns.
          </p>
          <Link
            href="/dashboard/businesses/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Business
          </Link>
        </div>
      )}
    </div>
  );
}

