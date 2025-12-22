import { NextRequest, NextResponse } from "next/server";

/**
 * API Route to publish scheduled posts
 * This is called automatically by Vercel Cron every minute (see vercel.json)
 * 
 * Usage: GET /api/posts/publish-scheduled
 * 
 * Note: For security, you may want to add authentication in production
 */
export async function GET(request: NextRequest) {
  // Optional: Add a secret token check for security
  // const authHeader = request.headers.get('authorization');
  // const cronSecret = process.env.CRON_SECRET;
  // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  try {
    // Dynamically import Firebase to avoid initialization during build
    const { collection, query, where, getDocs, updateDoc, doc, Timestamp } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase/config");
    const { getFacebookConnection } = await import("@/lib/firebase/facebook");
    
    const now = Timestamp.now();
    
    // Find all posts that are scheduled
    // Note: We filter by scheduledDate in code since Firestore compound queries are limited
    const postsRef = collection(db, "posts");
    const q = query(
      postsRef,
      where("status", "==", "scheduled")
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter posts where scheduledDate has passed
    const postsToPublish = querySnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          scheduledDate: data.scheduledDate,
        } as any;
      })
      .filter((post: any) => {
        if (!post.scheduledDate) return false;
        const scheduledDate = post.scheduledDate instanceof Timestamp 
          ? post.scheduledDate 
          : Timestamp.fromDate(new Date(post.scheduledDate));
        return scheduledDate.toMillis() <= now.toMillis();
      });

    if (postsToPublish.length === 0) {
      return NextResponse.json({
        message: "No posts to publish",
        count: 0,
      });
    }

    const results = [];

    for (const post of postsToPublish) {
      try {
        // getFacebookConnection is already imported above
        const facebookConnection = await getFacebookConnection(post.businessId);
        
        if (!facebookConnection || !facebookConnection.accessToken) {
          const errorMsg = !facebookConnection 
            ? `No Facebook connection found for business ${post.businessId}`
            : `Facebook connection exists but no access token for business ${post.businessId}`;
          
          console.error(`[Publish Scheduled] Post ${post.id} failed: ${errorMsg}`);
          console.error(`[Publish Scheduled] Post details:`, {
            postId: post.id,
            businessId: post.businessId,
            platform: post.platform,
            hasConnection: !!facebookConnection,
            hasToken: !!facebookConnection?.accessToken,
          });
          
          // No Facebook connection, mark as failed with reason
          await updateDoc(doc(db, "posts", post.id), {
            status: "failed",
            updatedAt: Timestamp.now(),
            failureReason: errorMsg,
          });
          results.push({
            postId: post.id,
            status: "failed",
            reason: errorMsg,
          });
          continue;
        }

        // Validate we have a page ID
        const pageId = facebookConnection.pageId || facebookConnection.businessId;
        if (!pageId) {
          const errorMsg = `No page ID found for business ${post.businessId}`;
          console.error(`[Publish Scheduled] Post ${post.id} failed: ${errorMsg}`);
          console.error(`[Publish Scheduled] Facebook connection details:`, {
            pageId: facebookConnection.pageId,
            businessId: facebookConnection.businessId,
            hasPageId: !!facebookConnection.pageId,
          });
          
          await updateDoc(doc(db, "posts", post.id), {
            status: "failed",
            updatedAt: Timestamp.now(),
            failureReason: errorMsg,
          });
          results.push({
            postId: post.id,
            status: "failed",
            reason: errorMsg,
          });
          continue;
        }

        console.log(`[Publish Scheduled] Publishing post ${post.id} to Facebook page ${pageId}`);

        // Publish to Facebook
        const publishResult = await publishToFacebook(
          post.content,
          pageId,
          facebookConnection.accessToken
        );

        if (publishResult.success) {
          console.log(`[Publish Scheduled] Successfully published post ${post.id} to Facebook`);
          
          // Update post status to published
          await updateDoc(doc(db, "posts", post.id), {
            status: "published",
            publishedDate: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          results.push({
            postId: post.id,
            status: "published",
            platform: post.platform,
          });
        } else {
          const errorMsg = publishResult.error || "Unknown Facebook API error";
          console.error(`[Publish Scheduled] Failed to publish post ${post.id}: ${errorMsg}`);
          console.error(`[Publish Scheduled] Post details:`, {
            postId: post.id,
            businessId: post.businessId,
            platform: post.platform,
            contentLength: post.content?.length || 0,
            pageId: pageId,
          });
          
          // Mark as failed with reason
          await updateDoc(doc(db, "posts", post.id), {
            status: "failed",
            updatedAt: Timestamp.now(),
            failureReason: errorMsg,
          });
          results.push({
            postId: post.id,
            status: "failed",
            reason: errorMsg,
          });
        }
      } catch (error: any) {
        const errorMsg = error.message || "Unknown error during publishing";
        console.error(`[Publish Scheduled] Uncaught error publishing post ${post.id}:`, error);
        console.error(`[Publish Scheduled] Error stack:`, error.stack);
        console.error(`[Publish Scheduled] Post details:`, {
          postId: post.id,
          businessId: post.businessId,
          platform: post.platform,
        });
        
        // Mark as failed with reason
        await updateDoc(doc(db, "posts", post.id), {
          status: "failed",
          updatedAt: Timestamp.now(),
          failureReason: errorMsg,
        });
        results.push({
          postId: post.id,
          status: "failed",
          reason: errorMsg,
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${postsToPublish.length} scheduled post(s)`,
      count: postsToPublish.length,
      results,
      summary: {
        published: results.filter((r: any) => r.status === "published").length,
        failed: results.filter((r: any) => r.status === "failed").length,
      },
    });
  } catch (error: any) {
    console.error("Error publishing scheduled posts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish scheduled posts" },
      { status: 500 }
    );
  }
}

/**
 * Publish a post to Facebook
 */
async function publishToFacebook(
  message: string,
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; postId?: string }> {
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
    console.log(`[Publish Scheduled] Calling Facebook API: ${url}`);

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
      const errorMsg = data.error 
        ? `${data.error.message || "Facebook API error"} (Code: ${data.error.code || "unknown"})`
        : `HTTP ${response.status}: ${response.statusText}`;
      
      console.error(`[Publish Scheduled] Facebook API error:`, data.error || response.statusText);
      
      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log(`[Publish Scheduled] Facebook API success. Post ID: ${data.id || "unknown"}`);
    return { success: true, postId: data.id };
  } catch (error: any) {
    console.error(`[Publish Scheduled] Network error publishing to Facebook:`, error);
    return {
      success: false,
      error: error.message || "Failed to publish to Facebook",
    };
  }
}

