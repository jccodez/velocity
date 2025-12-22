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
          // No Facebook connection, mark as failed
          await updateDoc(doc(db, "posts", post.id), {
            status: "failed",
            updatedAt: Timestamp.now(),
          });
          results.push({
            postId: post.id,
            status: "failed",
            reason: "No Facebook connection found",
          });
          continue;
        }

        // Publish to Facebook
        const publishResult = await publishToFacebook(
          post.content,
          facebookConnection.pageId || facebookConnection.businessId,
          facebookConnection.accessToken
        );

        if (publishResult.success) {
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
          // Mark as failed
          await updateDoc(doc(db, "posts", post.id), {
            status: "failed",
            updatedAt: Timestamp.now(),
          });
          results.push({
            postId: post.id,
            status: "failed",
            reason: publishResult.error,
          });
        }
      } catch (error: any) {
        console.error(`Error publishing post ${post.id}:`, error);
        // Mark as failed
        await updateDoc(doc(db, "posts", post.id), {
          status: "failed",
          updatedAt: Timestamp.now(),
        });
        results.push({
          postId: post.id,
          status: "failed",
          reason: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${postsToPublish.length} scheduled post(s)`,
      count: postsToPublish.length,
      results,
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          access_token: accessToken,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message || "Facebook API error",
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to publish to Facebook",
    };
  }
}

