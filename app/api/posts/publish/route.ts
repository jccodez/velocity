import { NextRequest, NextResponse } from "next/server";

/**
 * API Route to publish a post immediately
 * 
 * Usage: POST /api/posts/publish
 * Body: { postId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, content, platform, pageId, accessToken } = body;

    if (!businessId || !content || !platform || !pageId || !accessToken) {
      return NextResponse.json(
        { error: "Business ID, content, platform, page ID, and access token are required" },
        { status: 400 }
      );
    }

    // Only support Facebook for now
    if (platform !== "facebook") {
      return NextResponse.json(
        { error: `Publishing to ${platform} is not yet supported` },
        { status: 400 }
      );
    }

    // Client passes Facebook connection data to avoid Firestore reads
    const { pageId, accessToken } = body;

    if (!pageId || !accessToken) {
      return NextResponse.json(
        { error: "Page ID and access token are required" },
        { status: 400 }
      );
    }

    // Publish to Facebook
    const publishResult = await publishToFacebook(
      content,
      pageId,
      accessToken
    );

    if (publishResult.success) {
      // Client will update Firestore (has user auth)
      return NextResponse.json({
        success: true,
        message: "Post published successfully",
        facebookPostId: publishResult.facebookPostId,
      });
    } else {
      // Return error - client will update status
      return NextResponse.json(
        { error: publishResult.error || "Failed to publish post" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error publishing post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish post" },
      { status: 500 }
    );
  }
}

/**
 * Publish a post to Facebook (same function as in publish-scheduled)
 */
async function publishToFacebook(
  message: string,
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; facebookPostId?: string }> {
  try {
    if (!message || !message.trim()) {
      return {
        success: false,
        error: "Post content is empty",
      };
    }

    if (!pageId || !pageId.trim()) {
      return {
        success: false,
        error: "Facebook page ID is missing",
      };
    }

    if (!accessToken || !accessToken.trim()) {
      return {
        success: false,
        error: "Facebook access token is missing",
      };
    }

    const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    console.log(`[Publish Now] Calling Facebook API: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message.trim(),
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      let errorMsg = "Unknown Facebook API error";
      
      if (data.error) {
        const error = data.error;
        errorMsg = `${error.message || "Facebook API error"}`;
        if (error.type) {
          errorMsg += ` (Type: ${error.type})`;
        }
        if (error.code) {
          errorMsg += ` (Code: ${error.code})`;
        }
      } else {
        errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      }

      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log(`[Publish Now] Facebook API success. Post ID: ${data.id || "unknown"}`);
    return { success: true, facebookPostId: data.id };
  } catch (error: any) {
    console.error(`[Publish Now] Network error publishing to Facebook:`, error);
    return {
      success: false,
      error: error.message || "Failed to publish to Facebook",
    };
  }
}

