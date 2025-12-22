import { NextRequest, NextResponse } from "next/server";

/**
 * Facebook OAuth Connect Route
 * This initiates the Facebook OAuth flow for a specific business
 * 
 * Usage: GET /api/facebook/connect?businessId=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const businessId = searchParams.get("businessId");
  
  if (!businessId) {
    return NextResponse.json(
      { error: "businessId parameter is required" },
      { status: 400 }
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/facebook/callback?businessId=${businessId}`;

  const facebookAppId = process.env.FACEBOOK_APP_ID;
  
  if (!facebookAppId) {
    return NextResponse.json(
      { error: "Facebook App ID not configured. Please add FACEBOOK_APP_ID to .env.local" },
      { status: 500 }
    );
  }

  // Facebook OAuth URL
  const scope = "pages_read_engagement,pages_read_user_content,pages_show_list,read_insights";
  const facebookOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${businessId}`;

  return NextResponse.redirect(facebookOAuthUrl);
}

