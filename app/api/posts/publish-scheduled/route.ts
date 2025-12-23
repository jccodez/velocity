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
  // Log that the route was called
  console.log(`[Publish Scheduled] Route called at ${new Date().toISOString()}`);
  console.log(`[Publish Scheduled] Request headers:`, {
    'user-agent': request.headers.get('user-agent'),
    'x-vercel-cron': request.headers.get('x-vercel-cron'),
  });
  
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
    
    console.log(`[Publish Scheduled] Found ${querySnapshot.docs.length} scheduled post(s) in database`);
    
    // Filter posts where scheduledDate has passed
    const allScheduledPosts = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        scheduledDate: data.scheduledDate,
      } as any;
    });
    
    const postsToPublish = allScheduledPosts.filter((post: any) => {
      if (!post.scheduledDate) {
        console.log(`[Publish Scheduled] Post ${post.id} skipped: no scheduledDate`);
        return false;
      }
      const scheduledDate = post.scheduledDate instanceof Timestamp 
        ? post.scheduledDate 
        : Timestamp.fromDate(new Date(post.scheduledDate));
      
      const scheduledMillis = scheduledDate.toMillis();
      const nowMillis = now.toMillis();
      const isReady = scheduledMillis <= nowMillis;
      
      console.log(`[Publish Scheduled] Post ${post.id}:`, {
        scheduledDate: scheduledDate.toDate().toISOString(),
        scheduledMillis,
        nowMillis,
        isReady,
        timeUntilPublish: isReady ? "READY NOW" : `${Math.round((scheduledMillis - nowMillis) / 1000 / 60)} minutes`,
      });
      
      return isReady;
    });

    console.log(`[Publish Scheduled] ${postsToPublish.length} post(s) ready to publish out of ${allScheduledPosts.length} scheduled post(s)`);

    if (postsToPublish.length === 0) {
      // Log details about scheduled posts that aren't ready yet
      if (allScheduledPosts.length > 0) {
        console.log(`[Publish Scheduled] Scheduled posts found but not ready yet:`, 
          allScheduledPosts.map((post: any) => ({
            id: post.id,
            scheduledDate: post.scheduledDate instanceof Timestamp 
              ? post.scheduledDate.toDate().toISOString()
              : new Date(post.scheduledDate).toISOString(),
            businessId: post.businessId,
          }))
        );
      }
      
      return NextResponse.json({
        message: "No posts to publish",
        count: 0,
        scheduledPostsFound: allScheduledPosts.length,
        info: allScheduledPosts.length > 0 
          ? `${allScheduledPosts.length} post(s) scheduled but not ready yet`
          : "No scheduled posts found",
      });
    }

    const results = [];

    for (const post of postsToPublish) {
      try {
        console.log(`[Publish Scheduled] Processing post ${post.id} for business ${post.businessId}`);
        
        // getFacebookConnection is already imported above
        let facebookConnection;
        try {
          facebookConnection = await getFacebookConnection(post.businessId);
        } catch (fbError: any) {
          const errorMsg = `Failed to get Facebook connection: ${fbError.message || fbError}`;
          console.error(`[Publish Scheduled] Post ${post.id} failed to get Facebook connection:`, fbError);
          console.error(`[Publish Scheduled] Error details:`, {
            error: fbError.message,
            code: fbError.code,
            stack: fbError.stack,
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
          continue;
        }
        
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
          facebookConnection.accessToken,
          post.mediaUrls || []
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
  accessToken: string,
  mediaUrls: string[] = []
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

    // If there are images, use the photos endpoint with attached_media
    if (mediaUrls.length > 0) {
      // First, upload each image to Facebook and get their media IDs
      const mediaIds: string[] = [];
      
      for (const imageUrl of mediaUrls) {
        try {
          // Upload photo to Facebook and get media ID
          const photoResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}/photos?url=${encodeURIComponent(imageUrl)}&published=false&access_token=${accessToken}`,
            {
              method: "POST",
            }
          );

          const photoData = await photoResponse.json();

          if (!photoResponse.ok || photoData.error) {
            console.error(`[Publish Scheduled] Failed to upload image ${imageUrl}:`, photoData.error);
            // Continue with other images
            continue;
          }

          if (photoData.id) {
            mediaIds.push(photoData.id);
          }
        } catch (error) {
          console.error(`[Publish Scheduled] Error uploading image ${imageUrl}:`, error);
          // Continue with other images
        }
      }

      // If we have media IDs, post with attached media
      if (mediaIds.length > 0) {
        const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
        console.log(`[Publish Scheduled] Calling Facebook API with ${mediaIds.length} image(s): ${url}`);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message.trim(),
            attached_media: mediaIds.map((id) => ({ media_fbid: id })),
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
            if (error.error_subcode) {
              errorMsg += ` (Subcode: ${error.error_subcode})`;
            }
            if (error.fbtrace_id) {
              errorMsg += ` (Trace ID: ${error.fbtrace_id})`;
            }
            console.error(`[Publish Scheduled] Facebook API error details:`, {
              type: error.type,
              code: error.code,
              subcode: error.error_subcode,
              message: error.message,
              fbtrace_id: error.fbtrace_id,
            });
          } else {
            errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          }
          
          return {
            success: false,
            error: errorMsg,
          };
        }

        console.log(`[Publish Scheduled] Facebook API success with images. Post ID: ${data.id || "unknown"}`);
        return { success: true, facebookPostId: data.id };
      }
    }

    // Fallback to text-only post (original behavior)
    const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    console.log(`[Publish Scheduled] Calling Facebook API: ${url}`);
    console.log(`[Publish Scheduled] Request details:`, {
      pageId: pageId,
      messageLength: message.trim().length,
      accessTokenLength: accessToken.length,
      accessTokenPrefix: accessToken.substring(0, 20) + "...",
    });

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
    
    console.log(`[Publish Scheduled] Facebook API response:`, {
      status: response.status,
      statusText: response.statusText,
      hasError: !!data.error,
      error: data.error,
      responseData: data,
    });

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
        if (error.error_subcode) {
          errorMsg += ` (Subcode: ${error.error_subcode})`;
        }
        if (error.error_user_title) {
          errorMsg += ` - ${error.error_user_title}`;
        }
        if (error.error_user_msg) {
          errorMsg += `: ${error.error_user_msg}`;
        }
      } else {
        errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      console.error(`[Publish Scheduled] Facebook API error details:`, {
        fullError: data.error,
        errorMessage: errorMsg,
        status: response.status,
        statusText: response.statusText,
        fullResponse: data,
      });
      
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

