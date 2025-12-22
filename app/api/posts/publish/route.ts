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
    const { postId, businessId } = body;

    if (!postId || !businessId) {
      return NextResponse.json(
        { error: "Post ID and Business ID are required" },
        { status: 400 }
      );
    }

    // Dynamically import Firebase to avoid initialization during build
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase/config");
    const { getFacebookConnection } = await import("@/lib/firebase/facebook");

    // Get the post (client will verify ownership via Firestore rules)
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const post = postSnap.data();
    
    // Verify businessId matches
    if (post.businessId !== businessId) {
      return NextResponse.json(
        { error: "Business ID mismatch" },
        { status: 400 }
      );
    }

    // Check if post is already published
    if (post.status === "published") {
      return NextResponse.json(
        { error: "Post is already published" },
        { status: 400 }
      );
    }

    // Only support Facebook for now
    if (post.platform !== "facebook") {
      return NextResponse.json(
        { error: `Publishing to ${post.platform} is not yet supported` },
        { status: 400 }
      );
    }

    // Get Facebook connection
    const facebookConnection = await getFacebookConnection(post.businessId);

    if (!facebookConnection || !facebookConnection.accessToken) {
      return NextResponse.json(
        { error: "No Facebook connection found for this business. Please connect Facebook first." },
        { status: 400 }
      );
    }

    // Validate we have a page ID
    const pageId = facebookConnection.pageId || facebookConnection.businessId;
    if (!pageId) {
      return NextResponse.json(
        { error: "No Facebook page ID found" },
        { status: 400 }
      );
    }

    // Publish to Facebook
    const publishResult = await publishToFacebook(
      post.content,
      pageId,
      facebookConnection.accessToken
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

