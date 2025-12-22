import { NextRequest, NextResponse } from "next/server";

/**
 * Facebook OAuth Callback Route
 * Exchanges authorization code for access token and saves to business
 * 
 * Usage: GET /api/facebook/callback?code=...&businessId=xxx
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const businessId = searchParams.get("businessId") || searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    const redirectUrl = businessId 
      ? `${baseUrl}/dashboard/businesses/${businessId}?facebook_error=${encodeURIComponent(error)}`
      : `${baseUrl}/dashboard/settings?facebook_error=${encodeURIComponent(error)}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    return NextResponse.json(
      { error: "No authorization code provided" },
      { status: 400 }
    );
  }

  if (!businessId) {
    return NextResponse.json(
      { error: "Business ID is required" },
      { status: 400 }
    );
  }

  const facebookAppId = process.env.FACEBOOK_APP_ID;
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = `${baseUrl}/api/facebook/callback?businessId=${businessId}`;

  if (!facebookAppId || !facebookAppSecret) {
    return NextResponse.json(
      { error: "Facebook credentials not configured" },
      { status: 500 }
    );
  }

  try {
    // Note: We can't verify business ownership here without auth context
    // The security rules will enforce ownership when saving the token
    // We'll let the client-side verify and complete the connection

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${facebookAppId}&client_secret=${facebookAppSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
      { method: "GET" }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/businesses/${businessId}?facebook_error=${encodeURIComponent(tokenData.error.message)}`
      );
    }

    const accessToken = tokenData.access_token;

    // Get long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${facebookAppId}&client_secret=${facebookAppSecret}&fb_exchange_token=${accessToken}`
    );

    const longLivedData = await longLivedResponse.json();
    const longLivedToken = longLivedData.access_token || accessToken;

    // Get user's pages to find the matching page
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}&fields=id,name,access_token`
    );

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/businesses/${businessId}?facebook_error=${encodeURIComponent("No Facebook pages found. Please make sure you're an admin of at least one page.")}`
      );
    }

    // Use first page (or let user select later)
    const selectedPage = pages[0];

    // Store token temporarily in URL params - client will verify and save
    // This avoids permission issues in the API route
    const pageToken = selectedPage?.access_token || longLivedToken;
    
    // Redirect with token data - client will complete the save
    return NextResponse.redirect(
      `${baseUrl}/dashboard/businesses/${businessId}?facebook_callback=true&facebook_token=${encodeURIComponent(pageToken)}&facebook_page_id=${selectedPage?.id || ""}&facebook_page_name=${encodeURIComponent(selectedPage?.name || "Connected")}`
    );
  } catch (error: any) {
    console.error("Facebook callback error:", error);
    const redirectUrl = businessId 
      ? `${baseUrl}/dashboard/businesses/${businessId}?facebook_error=${encodeURIComponent(error.message || "Connection failed")}`
      : `${baseUrl}/dashboard/settings?facebook_error=${encodeURIComponent(error.message || "Connection failed")}`;
    return NextResponse.redirect(redirectUrl);
  }
}

