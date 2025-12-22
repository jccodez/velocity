"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { getPostsByBusinessId, SocialPost, updatePost, getPostById } from "@/lib/firebase/posts";
import { Timestamp } from "firebase/firestore";
import { getBusinessesByUserId } from "@/lib/firebase/businesses";
import { Plus, FileText, Sparkles, Calendar, CheckCircle, Edit, Send, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
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
      // Sort by creation date (newest first)
      allPosts.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      setPosts(allPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading posts...</div>
      </div>
    );
  }

  const handlePublishNow = async (postId: string) => {
    if (!postId) return;
    
    setPublishingPostId(postId);
    try {
      // Get the post to verify we have access and get business info
      const post = await getPostById(postId);
      if (!post) {
        alert("Post not found");
        return;
      }

      // Check if already published
      if (post.status === "published") {
        alert("Post is already published");
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
          businessId: post.businessId,
          content: post.content,
          platform: post.platform,
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
        await loadPosts();
        return;
      }

      // Update post status to published on client-side (has user auth)
      await updatePost(postId, {
        status: "published",
        publishedDate: Timestamp.now(),
      });

      // Reload posts to show updated status
      await loadPosts();
    } catch (error) {
      console.error("Error publishing post:", error);
      alert("Failed to publish post");
    } finally {
      setPublishingPostId(null);
    }
  };

  const getStatusColor = (status: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          <p className="text-gray-600 mt-2">
            Manage your social media posts
          </p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first post to start engaging with your audience.
          </p>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {post.aiGenerated ? (
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 capitalize">
                        {post.platform}
                      </span>
                      {post.aiGenerated && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          AI Generated
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        post.status
                      )}`}
                    >
                      {post.status}
                    </span>
                  </div>
                </div>
                {post.scheduledDate && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {post.scheduledDate.toDate().toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mb-4">
                {post.content}
              </p>
              {post.status === "failed" && post.failureReason && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Publishing Failed</p>
                  <p className="text-xs text-red-700">{post.failureReason}</p>
                </div>
              )}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">
                    {post.mediaUrls.length} media file(s)
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                {post.status !== "published" && (
                  <button
                    onClick={() => post.id && handlePublishNow(post.id)}
                    disabled={publishingPostId === post.id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {publishingPostId === post.id ? (
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
                  href={`/dashboard/posts/${post.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

