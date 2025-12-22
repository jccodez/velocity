"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { getPostsByBusinessId, SocialPost } from "@/lib/firebase/posts";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";

export default function SchedulePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadScheduledPosts();
    }
  }, [user]);

  const loadScheduledPosts = async () => {
    if (!user) return;
    try {
      const businesses = await getBusinessesByUserId(user.uid);
      let allPosts: SocialPost[] = [];
      for (const business of businesses) {
        if (business.id) {
          const businessPosts = await getPostsByBusinessId(business.id);
          allPosts = [...allPosts, ...businessPosts];
        }
      }
      
      // Filter scheduled posts only - Firestore Timestamps should already be Timestamp objects
      // Show all scheduled posts (past and future) - they'll be published by the cron job
      const scheduled = allPosts.filter((post) => {
        const isScheduled = post.status === "scheduled" && post.scheduledDate;
        if (!isScheduled && post.status === "scheduled") {
          console.warn("Post has 'scheduled' status but no scheduledDate:", post.id);
        }
        return isScheduled;
      });
      
      // Sort by scheduled date
      scheduled.sort((a, b) => {
        if (!a.scheduledDate || !b.scheduledDate) return 0;
        // Handle both Timestamp objects (from Firestore) and plain objects
        const getMillis = (date: any): number => {
          if (date instanceof Timestamp) {
            return date.toMillis();
          }
          if (date && typeof date === 'object' && 'seconds' in date) {
            return (date.seconds || 0) * 1000 + ((date.nanoseconds || 0) / 1000000);
          }
          if (date && typeof date.toMillis === 'function') {
            return date.toMillis();
          }
          return 0;
        };
        return getMillis(a.scheduledDate) - getMillis(b.scheduledDate);
      });
      
      setPosts(scheduled);
    } catch (error) {
      console.error("Error loading scheduled posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
        <p className="text-gray-600 mt-2">
          View and manage your scheduled posts
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No scheduled posts
          </h3>
          <p className="text-gray-600 mb-4">
            Posts you schedule will appear here. Make sure to set a scheduled date and time when creating a post.
          </p>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Create Scheduled Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                      {post.platform}
                    </span>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {(() => {
                          const date = post.scheduledDate;
                          if (date instanceof Timestamp) {
                            return date.toDate().toLocaleString();
                          }
                          if (date && typeof date === 'object' && 'seconds' in date) {
                            const dateObj = date as { seconds: number; nanoseconds?: number };
                            return new Date((dateObj.seconds || 0) * 1000).toLocaleString();
                          }
                          if (date && typeof (date as any).toDate === 'function') {
                            return (date as any).toDate().toLocaleString();
                          }
                          return "Invalid date";
                        })()}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

