import { NextRequest, NextResponse } from "next/server";

/**
 * API Route to generate an image using AI (OpenAI DALL-E)
 * 
 * Usage: POST /api/images/generate
 * Body: { prompt: string, size?: "256x256" | "512x512" | "1024x1024" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, size = "1024x1024" } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Validate size
    const validSizes = ["256x256", "512x512", "1024x1024"];
    const imageSize = validSizes.includes(size) ? size : "1024x1024";

    // Call OpenAI DALL-E API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: imageSize,
        quality: "standard",
        response_format: "url",
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      let errorMsg = "Unknown OpenAI API error";
      
      if (data.error) {
        const error = data.error;
        errorMsg = `${error.message || "OpenAI API error"}`;
        if (error.code) {
          errorMsg += ` (Code: ${error.code})`;
        }
      } else {
        errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      }

      return NextResponse.json(
        { error: errorMsg },
        { status: response.status || 500 }
      );
    }

    if (!data.data || !data.data[0] || !data.data[0].url) {
      return NextResponse.json(
        { error: "No image URL returned from OpenAI" },
        { status: 500 }
      );
    }

    // Optionally, download the image and upload to Firebase Storage
    // For now, return the OpenAI URL directly
    // Note: OpenAI URLs expire after a certain time, so you may want to download and store them
    const imageUrl = data.data[0].url;

    return NextResponse.json({
      success: true,
      url: imageUrl,
      revisedPrompt: data.data[0].revised_prompt || prompt,
    });
  } catch (error: any) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}

