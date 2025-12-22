"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { getPostsByBusinessId, SocialPost } from "@/lib/firebase/posts";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { Calendar, Clock } from "lucide-react";

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
      // Filter scheduled posts only
      const scheduled = allPosts.filter(
        (post) => post.status === "scheduled" && post.scheduledDate
      );
      // Sort by scheduled date
      scheduled.sort((a, b) => {
        if (!a.scheduledDate || !b.scheduledDate) return 0;
        return a.scheduledDate.toMillis() - b.scheduledDate.toMillis();
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
          <p className="text-gray-600">
            Posts you schedule will appear here.
          </p>
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
                        {post.scheduledDate?.toDate().toLocaleString()}
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

