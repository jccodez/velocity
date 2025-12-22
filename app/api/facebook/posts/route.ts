import { NextRequest, NextResponse } from "next/server";

/**
 * Fetch Facebook Posts Route
 * Fetches recent posts from a Facebook page
 * 
 * Usage: POST /api/facebook/posts
 * Body: { pageId: string, accessToken?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, accessToken } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: "Page ID is required" },
        { status: 400 }
      );
    }

    // Get token from request or environment (for testing)
    const token = accessToken || process.env.FACEBOOK_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Facebook access token required. Please connect your Facebook account in Settings." },
        { status: 401 }
      );
    }

    // Clean page ID (remove @ if present)
    const cleanPageId = pageId.replace(/^@/, '').trim();

    // Fetch recent posts
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${cleanPageId}/posts?fields=message,created_time,id&limit=20&access_token=${token}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Failed to fetch Facebook posts" },
        { status: 400 }
      );
    }

    const posts = (data.data || []).map((post: any) => ({
      id: post.id,
      message: post.message || "",
      createdAt: post.created_time,
    }));

    return NextResponse.json({
      posts,
      count: posts.length,
    });
  } catch (error: any) {
    console.error("Error fetching Facebook posts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Facebook posts" },
      { status: 500 }
    );
  }
}

