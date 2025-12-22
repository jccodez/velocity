import { NextRequest, NextResponse } from "next/server";

/**
 * AI Post Generation API Route
 * Generates social media post content using OpenAI
 * 
 * Usage: POST /api/ai/generate-post
 * Body: {
 *   businessName: string,
 *   businessDescription?: string,
 *   toneOfVoice?: string,
 *   platform: string,
 *   topic?: string,
 *   wordCount?: number,
 *   includeCallToAction?: boolean,
 *   provider?: 'openai' | 'anthropic'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      businessDescription,
      toneOfVoice,
      platform,
      topic,
      wordCount = 150,
      includeCallToAction = true,
      provider = 'openai',
    } = body;

    if (!businessName || !platform) {
      return NextResponse.json(
        { error: "businessName and platform are required" },
        { status: 400 }
      );
    }

    // Check for API key and determine which provider to use
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    // Debug logging (only in development)
    console.log('[AI API Debug] Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- OpenAI key present:', !!openaiKey);
    console.log('- OpenAI key length:', openaiKey?.length || 0);
    console.log('- OpenAI key starts with sk-:', openaiKey?.startsWith('sk-') || false);
    console.log('- Anthropic key present:', !!anthropicKey);
    
    // Log all env vars that start with OPENAI (for debugging)
    const openaiEnvVars = Object.keys(process.env).filter(key => key.includes('OPENAI'));
    console.log('- All OPENAI-related env vars:', openaiEnvVars);
    
    // Default to OpenAI if no provider specified
    const useOpenAI = provider === 'openai' || (!provider && openaiKey);
    const useAnthropic = provider === 'anthropic' && anthropicKey;
    
    // Generate with OpenAI
    if (useOpenAI && openaiKey) {
      return await generateWithOpenAI({
        businessName,
        businessDescription,
        toneOfVoice,
        platform,
        topic,
        wordCount,
        includeCallToAction,
      });
    }

    // Generate with Anthropic (if configured)
    if (useAnthropic && anthropicKey) {
      return await generateWithAnthropic({
        businessName,
        businessDescription,
        toneOfVoice,
        platform,
        topic,
        wordCount,
        includeCallToAction,
      });
    }

    // No provider configured
    if (!openaiKey && !anthropicKey) {
      return NextResponse.json(
        { 
          error: "AI API key not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env.local file and restart the development server.",
          details: "After adding the key, stop the server (Ctrl+C) and run 'npm run dev' again."
        },
        { status: 500 }
      );
    }

    // Provider requested but key not found
    if (provider === 'openai' && !openaiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not found in environment variables. Please check your .env.local file and restart the server." },
        { status: 500 }
      );
    }

    if (provider === 'anthropic' && !anthropicKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not found in environment variables. Please check your .env.local file and restart the server." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "No AI provider configured" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Error generating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate post content" },
      { status: 500 }
    );
  }
}

async function generateWithOpenAI(options: {
  businessName: string;
  businessDescription?: string;
  toneOfVoice?: string;
  platform: string;
  topic?: string;
  wordCount: number;
  includeCallToAction: boolean;
}) {
  const { businessName, businessDescription, toneOfVoice, platform, topic, wordCount, includeCallToAction } = options;

  // Build the prompt
  const platformGuidelines: Record<string, string> = {
    facebook: "Facebook posts should be engaging, conversational, and encourage interaction. Use questions, emojis, and call-to-actions. Ideal length: 40-80 words.",
    instagram: "Instagram posts should be visually descriptive, use relevant hashtags, and tell a story. Ideal length: 125-220 characters for captions. Include emojis and line breaks for readability.",
    twitter: "Twitter posts must be concise and impactful. Maximum 280 characters. Use hashtags sparingly (1-2 max). Be conversational and engaging.",
    linkedin: "LinkedIn posts should be professional yet approachable. Share insights, industry knowledge, or professional updates. Ideal length: 150-300 words. Use a professional tone.",
  };

  const platformGuide = platformGuidelines[platform.toLowerCase()] || "Create engaging content appropriate for this platform.";

  let systemPrompt = `You are an expert social media copywriter. Generate high-quality social media posts that are engaging, authentic, and tailored to each platform's best practices.

Platform: ${platform}
${platformGuide}

Requirements:
- Match the business's tone of voice exactly
- Be authentic and brand-consistent
- Use appropriate formatting for the platform
- Include relevant emojis when appropriate (but don't overuse them)
- Target around ${wordCount} words or characters (depending on platform)
${includeCallToAction ? "- Include a clear, compelling call-to-action" : "- No call-to-action needed"}`;

  let userPrompt = `Write a social media post for: ${businessName}`;

  if (businessDescription) {
    userPrompt += `\n\nBusiness description: ${businessDescription}`;
  }

  if (toneOfVoice) {
    userPrompt += `\n\nTone of voice/style: ${toneOfVoice}`;
    systemPrompt += `\n\nIMPORTANT: Match this exact tone of voice: "${toneOfVoice}"`;
  }

  if (topic) {
    userPrompt += `\n\nPost topic/theme: ${topic}`;
  }

  userPrompt += `\n\nGenerate the post content now. Only return the post content, no additional explanation or formatting.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: platform === "twitter" ? 150 : 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content?.trim() || "";

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    // Generate suggestions
    const suggestions = generateSuggestions(platform, generatedContent);

    return NextResponse.json({
      content: generatedContent,
      suggestions,
    });
  } catch (error: any) {
    console.error("OpenAI generation error:", error);
    throw error;
  }
}

async function generateWithAnthropic(options: {
  businessName: string;
  businessDescription?: string;
  toneOfVoice?: string;
  platform: string;
  topic?: string;
  wordCount: number;
  includeCallToAction: boolean;
}) {
  const { businessName, businessDescription, toneOfVoice, platform, topic, wordCount, includeCallToAction } = options;

  // Similar prompt structure for Anthropic
  const platformGuidelines: Record<string, string> = {
    facebook: "Facebook posts should be engaging, conversational, and encourage interaction. Use questions, emojis, and call-to-actions. Ideal length: 40-80 words.",
    instagram: "Instagram posts should be visually descriptive, use relevant hashtags, and tell a story. Ideal length: 125-220 characters for captions. Include emojis and line breaks for readability.",
    twitter: "Twitter posts must be concise and impactful. Maximum 280 characters. Use hashtags sparingly (1-2 max). Be conversational and engaging.",
    linkedin: "LinkedIn posts should be professional yet approachable. Share insights, industry knowledge, or professional updates. Ideal length: 150-300 words. Use a professional tone.",
  };

  const platformGuide = platformGuidelines[platform.toLowerCase()] || "Create engaging content appropriate for this platform.";

  let prompt = `You are an expert social media copywriter. Generate a high-quality ${platform} post.

${platformGuide}

Business: ${businessName}`;

  if (businessDescription) {
    prompt += `\n\nBusiness description: ${businessDescription}`;
  }

  if (toneOfVoice) {
    prompt += `\n\nTone of voice/style (match this exactly): ${toneOfVoice}`;
  }

  if (topic) {
    prompt += `\n\nPost topic/theme: ${topic}`;
  }

  prompt += `\n\nTarget length: Around ${wordCount} words or characters (depending on platform)`;
  
  if (includeCallToAction) {
    prompt += `\n\nInclude a clear, compelling call-to-action`;
  }

  prompt += `\n\nGenerate the post content now. Only return the post content, no additional explanation or formatting.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: platform === "twitter" ? 150 : 500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.content[0]?.text?.trim() || "";

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    const suggestions = generateSuggestions(platform, generatedContent);

    return NextResponse.json({
      content: generatedContent,
      suggestions,
    });
  } catch (error: any) {
    console.error("Anthropic generation error:", error);
    throw error;
  }
}

function generateSuggestions(platform: string, content: string): string[] {
  const suggestions: string[] = [];

  if (platform === "twitter" && content.length > 280) {
    suggestions.push("Content exceeds Twitter's 280 character limit - consider shortening");
  }

  if (platform === "instagram" && !content.includes("#")) {
    suggestions.push("Consider adding relevant hashtags for better discoverability");
  }

  if (platform === "linkedin" && content.length < 100) {
    suggestions.push("LinkedIn posts typically perform better with longer, more detailed content");
  }

  if (!content.match(/[!?]/)) {
    suggestions.push("Consider adding a question or exclamation to increase engagement");
  }

  if (!suggestions.length) {
    suggestions.push("Review and customize to match your brand voice");
    suggestions.push("Consider adding specific details or examples");
  }

  return suggestions;
}

