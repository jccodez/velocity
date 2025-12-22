import { NextRequest, NextResponse } from "next/server";

/**
 * Analyze Tone from Facebook Posts Route
 * Fetches posts and analyzes tone
 * 
 * Usage: POST /api/facebook/analyze-tone
 * Body: { pageId: string, accessToken: string }
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

    if (!accessToken) {
      return NextResponse.json(
        { error: "Facebook access token required. Please connect Facebook for this business first." },
        { status: 401 }
      );
    }
    
    const token = accessToken;

    const cleanPageId = pageId.replace(/^@/, '').trim();

    // Fetch posts
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${cleanPageId}/posts?fields=message,created_time&limit=20&access_token=${token}`
    );

    const postsData = await postsResponse.json();

    if (postsData.error) {
      return NextResponse.json(
        { error: postsData.error.message || "Failed to fetch posts" },
        { status: 400 }
      );
    }

    const posts = postsData.data || [];
    
    if (posts.length === 0) {
      return NextResponse.json(
        { error: "No posts found to analyze" },
        { status: 404 }
      );
    }

    // Extract text content
    const postTexts = posts
      .map((post: any) => post.message)
      .filter((msg: string) => msg && msg.trim().length > 0);

    if (postTexts.length === 0) {
      return NextResponse.json(
        { error: "No text content found in posts" },
        { status: 404 }
      );
    }

    const combinedText = postTexts.join('\n\n');

    // Analyze tone (pattern-based analysis)
    const lowerText = combinedText.toLowerCase();
    let characteristics: string[] = [];

    // Analyze formality
    const formalIndicators = ["professional", "expert", "solution", "service", "enterprise", "corporate"];
    const casualIndicators = ["hey", "awesome", "cool", "yay", "!", "😊", "🎉"];

    const formalCount = formalIndicators.filter(w => lowerText.includes(w)).length;
    const casualCount = casualIndicators.filter(w => lowerText.includes(w)).length;

    if (formalCount > casualCount * 1.5) {
      characteristics.push("professional");
    } else if (casualCount > formalCount * 1.5) {
      characteristics.push("casual and friendly");
    } else {
      characteristics.push("balanced");
    }

    // Analyze engagement
    const questionCount = (combinedText.match(/\?/g) || []).length;
    if (questionCount > combinedText.split('.').length * 0.3) {
      characteristics.push("engaging and conversational");
    }

    // Analyze enthusiasm
    const exclamationCount = (combinedText.match(/!/g) || []).length;
    if (exclamationCount > combinedText.length / 100) {
      characteristics.push("enthusiastic");
    }

    // Analyze emoji usage
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
    const emojiCount = (combinedText.match(emojiRegex) || []).length;
    if (emojiCount > combinedText.length / 200) {
      characteristics.push("visual and expressive");
    }

    // Analyze length patterns
    const avgLength = postTexts.reduce((sum: number, text: string) => sum + text.length, 0) / postTexts.length;
    if (avgLength < 100) {
      characteristics.push("concise");
    } else if (avgLength > 300) {
      characteristics.push("detailed and informative");
    }

    if (characteristics.length === 0) {
      characteristics.push("neutral and straightforward");
    }

    const toneDescription = `Based on recent ${postTexts.length} Facebook posts, the communication style is ${characteristics.join(", ")}. This analysis is based on language patterns, engagement style, and posting behavior.`;

    return NextResponse.json({
      tone: toneDescription,
      postCount: postTexts.length,
      characteristics,
    });
  } catch (error: any) {
    console.error("Error analyzing Facebook tone:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze Facebook tone" },
      { status: 500 }
    );
  }
}

