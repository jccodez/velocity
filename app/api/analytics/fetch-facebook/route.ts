import { NextRequest, NextResponse } from "next/server";

/**
 * API Route to fetch Facebook post analytics
 * 
 * Usage: POST /api/analytics/fetch-facebook
 * Body: { postId: string, facebookPostId: string, accessToken: string, pageId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, facebookPostId, accessToken, pageId, businessId } = body;

    if (!postId || !facebookPostId || !accessToken || !pageId || !businessId) {
      return NextResponse.json(
        { error: "Post ID, Facebook Post ID, access token, page ID, and business ID are required" },
        { status: 400 }
      );
    }

    // Fetch post insights from Facebook Graph API
    const insightsUrl = `https://graph.facebook.com/v18.0/${facebookPostId}/insights?metric=post_impressions,post_reach,post_reactions_by_type_total,post_clicks&access_token=${accessToken}`;
    
    console.log(`[Analytics] Fetching insights for post ${facebookPostId}`);
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();

    if (!insightsResponse.ok || insightsData.error) {
      console.error(`[Analytics] Facebook insights error:`, insightsData.error);
      // Try to get basic engagement data instead
      return await fetchBasicEngagement(postId, facebookPostId, accessToken, businessId);
    }

    // Parse insights data
    let impressions = 0;
    let reach = 0;
    let reactions = 0;
    let clicks = 0;

    if (insightsData.data) {
      for (const metric of insightsData.data) {
        if (metric.name === "post_impressions" && metric.values && metric.values[0]) {
          impressions = parseInt(metric.values[0].value) || 0;
        }
        if (metric.name === "post_reach" && metric.values && metric.values[0]) {
          reach = parseInt(metric.values[0].value) || 0;
        }
        if (metric.name === "post_reactions_by_type_total" && metric.values && metric.values[0]) {
          reactions = parseInt(metric.values[0].value) || 0;
        }
        if (metric.name === "post_clicks" && metric.values && metric.values[0]) {
          clicks = parseInt(metric.values[0].value) || 0;
        }
      }
    }

    // Fetch engagement data (likes, comments, shares)
    const engagementUrl = `https://graph.facebook.com/v18.0/${facebookPostId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`;
    const engagementResponse = await fetch(engagementUrl);
    const engagementData = await engagementResponse.json();

    let likes = 0;
    let comments = 0;
    let shares = 0;

    if (!engagementResponse.ok || engagementData.error) {
      console.warn(`[Analytics] Could not fetch engagement data:`, engagementData.error);
    } else {
      likes = engagementData.likes?.summary?.total_count || engagementData.likes?.data?.length || 0;
      comments = engagementData.comments?.summary?.total_count || engagementData.comments?.data?.length || 0;
      shares = engagementData.shares?.count || 0;
    }

    // Calculate engagement rate
    const totalEngagement = likes + comments + shares;
    const engagement = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

    // Save to Firestore
    const { createOrUpdatePostAnalytics } = await import("@/lib/firebase/analytics");
    await createOrUpdatePostAnalytics({
      postId,
      businessId,
      platform: "facebook",
      facebookPostId,
      likes,
      comments,
      shares,
      reactions,
      clicks,
      impressions,
      reach,
      engagement: Math.round(engagement * 100) / 100, // Round to 2 decimal places
    });

    return NextResponse.json({
      success: true,
      analytics: {
        likes,
        comments,
        shares,
        reactions,
        clicks,
        impressions,
        reach,
        engagement,
      },
    });
  } catch (error: any) {
    console.error("Error fetching Facebook analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

/**
 * Fallback: Fetch basic engagement data if insights are not available
 */
async function fetchBasicEngagement(
  postId: string,
  facebookPostId: string,
  accessToken: string,
  businessId: string
) {
  try {
    const engagementUrl = `https://graph.facebook.com/v18.0/${facebookPostId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`;
    const engagementResponse = await fetch(engagementUrl);
    const engagementData = await engagementResponse.json();

    if (engagementResponse.ok && !engagementData.error) {
      const likes = engagementData.likes?.summary?.total_count || engagementData.likes?.data?.length || 0;
      const comments = engagementData.comments?.summary?.total_count || engagementData.comments?.data?.length || 0;
      const shares = engagementData.shares?.count || 0;

      // Save basic analytics
      const { createOrUpdatePostAnalytics } = await import("@/lib/firebase/analytics");
      await createOrUpdatePostAnalytics({
        postId,
        businessId,
        platform: "facebook",
        facebookPostId,
        likes,
        comments,
        shares,
        engagement: 0, // Can't calculate without impressions
      });

      return NextResponse.json({
        success: true,
        analytics: {
          likes,
          comments,
          shares,
          reactions: 0,
          clicks: 0,
          impressions: 0,
          reach: 0,
          engagement: 0,
        },
      });
    }

    throw new Error("Could not fetch engagement data");
  } catch (error: any) {
    console.error("Error fetching basic engagement:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

