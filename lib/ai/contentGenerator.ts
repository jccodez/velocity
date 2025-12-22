// AI Content Generation Service
// This will be expanded later to integrate with OpenAI, Anthropic, or other AI services

export interface ContentGenerationOptions {
  businessName: string;
  businessDescription?: string;
  toneOfVoice?: string;
  platform: string; // "facebook", "instagram", "twitter", etc.
  topic?: string;
  wordCount?: number;
  includeCallToAction?: boolean;
}

export interface GeneratedContent {
  content: string;
  suggestions?: string[];
}

export const generatePostContent = async (
  options: ContentGenerationOptions
): Promise<GeneratedContent> => {
  // Always try API route first - it will check for API keys server-side
  // This is safer than checking client-side environment variables
  try {
    const response = await fetch('/api/ai/generate-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: options.businessName,
        businessDescription: options.businessDescription,
        toneOfVoice: options.toneOfVoice,
        platform: options.platform,
        topic: options.topic,
        wordCount: options.wordCount || 150,
        includeCallToAction: options.includeCallToAction,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        content: data.content,
        suggestions: data.suggestions || [],
      };
    }
  } catch (error) {
    console.error("Error calling AI API:", error);
    // Fall through to template generation
  }
  
  // Fallback to template-based generation if API is not available
  return generateTemplateContent(options);
};

const generateTemplateContent = (options: ContentGenerationOptions): GeneratedContent => {
  const platformSpecificTips: Record<string, string> = {
    facebook: "Engage with questions or share valuable insights that resonate with your audience.",
    instagram: "Use hashtags and visual storytelling to capture attention and inspire action.",
    twitter: "Keep it concise and conversational with a clear message that sparks engagement.",
    linkedin: "Share professional insights and industry knowledge that adds value to your network.",
  };

  const platformTips: Record<string, string> = {
    facebook: "💬 Ask a question or share an insight",
    instagram: "📸 Perfect for visual storytelling",
    twitter: "⚡ Keep it short and impactful",
    linkedin: "💼 Professional and informative",
  };

  const tip = platformSpecificTips[options.platform] || "Share engaging content that connects with your audience.";
  const platformTip = platformTips[options.platform] || "✨ Share engaging content";

  // Build content based on available information
  let content = "";
  
  if (options.topic) {
    content += `🎯 ${options.topic}\n\n`;
  }
  
  if (options.businessDescription) {
    content += `${options.businessDescription}\n\n`;
  } else {
    content += `${tip}\n\n`;
  }
  
  if (options.toneOfVoice) {
    content += `\n💡 Tone: ${options.toneOfVoice}`;
  }
  
  if (options.includeCallToAction) {
    content += `\n\n👉 Learn more at our website or contact us today!`;
  }

  return {
    content: content.trim(),
    suggestions: [
      "Customize the message to match your brand voice",
      "Add specific details about your products or services",
      "Include relevant hashtags or mentions",
      options.platform === "instagram" ? "Don't forget to add a compelling image" : undefined,
      options.platform === "twitter" ? "Keep it under 280 characters" : undefined,
    ].filter(Boolean) as string[],
  };
};

const generateWithOpenAI = async (options: ContentGenerationOptions): Promise<GeneratedContent> => {
  try {
    const response = await fetch('/api/ai/generate-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: options.businessName,
        businessDescription: options.businessDescription,
        toneOfVoice: options.toneOfVoice,
        platform: options.platform,
        topic: options.topic,
        wordCount: options.wordCount || 150,
        includeCallToAction: options.includeCallToAction,
        provider: 'openai',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'AI generation failed');
    }

    const data = await response.json();
    return {
      content: data.content,
      suggestions: data.suggestions || [],
    };
  } catch (error: any) {
    console.error("Error generating with OpenAI:", error);
    // Fallback to template
    return generateTemplateContent(options);
  }
};

const generateWithAnthropic = async (options: ContentGenerationOptions): Promise<GeneratedContent> => {
  try {
    const response = await fetch('/api/ai/generate-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: options.businessName,
        businessDescription: options.businessDescription,
        toneOfVoice: options.toneOfVoice,
        platform: options.platform,
        topic: options.topic,
        wordCount: options.wordCount || 150,
        includeCallToAction: options.includeCallToAction,
        provider: 'anthropic',
      }),
    });

    if (!response.ok) {
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    return {
      content: data.content,
      suggestions: data.suggestions || [],
    };
  } catch (error) {
    console.error("Error generating with Anthropic:", error);
    // Fallback to template
    return generateTemplateContent(options);
  }
};

/**
 * Analyzes tone from website content
 * This uses a client-side approach to extract text from the website
 * Note: For production, consider using a server-side API route to avoid CORS issues
 */
export const analyzeToneFromWebsite = async (
  websiteUrl: string
): Promise<string> => {
  try {
    // In a real implementation, this would:
    // 1. Use a server-side API route to fetch website content (to avoid CORS)
    // 2. Extract text content from HTML
    // 3. Use AI (OpenAI, Anthropic, etc.) to analyze tone
    
    // For now, we'll use a pattern-based analysis
    // In production, replace this with actual AI analysis
    
    const response = await fetch(websiteUrl, {
      mode: 'no-cors', // This will only work for same-origin or CORS-enabled sites
    }).catch(() => null);
    
    // Since we can't easily scrape client-side due to CORS,
    // we'll provide a manual analysis prompt or use an API route
    
    // TODO: Create /api/analyze-tone endpoint that:
    // - Fetches website content server-side
    // - Uses AI to analyze tone
    // - Returns tone description
    
    // For now, return a prompt for the user or use AI if API key is available
    if (process.env.NEXT_PUBLIC_AI_API_KEY) {
      // If you have an AI API key, you can call it here
      // Example with OpenAI:
      /*
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'Analyze the tone of voice from the following website content and provide a brief description (2-3 sentences) of the communication style, personality, and tone.'
          }, {
            role: 'user',
            content: websiteContent
          }]
        })
      });
      */
    }
    
    // Placeholder - prompts user to enter tone manually or uses description
    return "Analysis pending - enter tone manually or wait for AI analysis";
  } catch (error) {
    console.error("Error analyzing website tone:", error);
    throw new Error("Failed to analyze website tone. Please enter tone manually.");
  }
};

/**
 * Analyzes tone from Facebook page posts
 * Uses Facebook Graph API to fetch recent posts and analyzes them
 */
export const analyzeToneFromFacebook = async (
  pageIdOrUsername: string,
  accessToken?: string
): Promise<string> => {
  try {
    // Remove @ symbol if present
    const cleanHandle = pageIdOrUsername.replace(/^@/, '').trim();
    
    // Use API route to analyze tone (keeps token secure)
    const response = await fetch('/api/facebook/analyze-tone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageId: cleanHandle,
        accessToken: accessToken, // Optional, will use stored token if not provided
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze Facebook tone');
    }

    const data = await response.json();
    return data.tone;
  } catch (error: any) {
    console.error("Error analyzing Facebook tone:", error);
    throw new Error(error.message || "Failed to analyze Facebook tone");
  }
};

/**
 * Analyzes tone from any social media platform
 * Generic function that can work with fetched social media content
 */
export const analyzeToneFromSocialMedia = async (
  platform: string,
  accountHandle: string,
  posts?: string[]
): Promise<string> => {
  try {
    // If posts are provided, analyze them directly
    if (posts && posts.length > 0) {
      const combinedText = posts.join('\n\n');
      return await analyzeTextTone(combinedText);
    }
    
    // Otherwise, platform-specific fetching would happen here
    // For now, return a message
    return `Social media analysis for ${platform} requires API integration. Please connect your ${platform} account in Settings.`;
  } catch (error) {
    console.error("Error analyzing social media tone:", error);
    throw new Error("Failed to analyze social media tone. Please enter tone manually.");
  }
};

/**
 * Helper function to analyze tone from text content
 */
const analyzeTextTone = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) {
    throw new Error("No text content to analyze");
  }
  
  // Basic pattern-based analysis
  const lowerText = text.toLowerCase();
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
  
  // Analyze engagement style
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount > text.split('.').length * 0.3) {
    characteristics.push("engaging and conversational");
  }
  
  // Analyze enthusiasm
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > text.length / 100) {
    characteristics.push("enthusiastic");
  }
  
  // Analyze emoji usage
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
  const emojiCount = (text.match(emojiRegex) || []).length;
  if (emojiCount > text.length / 200) {
    characteristics.push("visual and expressive");
  }
  
  // Analyze length patterns
  const avgLength = text.split(/\n/).reduce((sum, line) => sum + line.length, 0) / text.split(/\n/).length;
  if (avgLength < 100) {
    characteristics.push("concise");
  } else if (avgLength > 300) {
    characteristics.push("detailed and informative");
  }
  
  if (characteristics.length === 0) {
    characteristics.push("neutral and straightforward");
  }
  
  const toneDescription = characteristics.join(", ");
  
  return `Based on recent ${text.split(/\n/).length} posts, the communication style is ${toneDescription}. This analysis is based on language patterns and posting style.`;
};

/**
 * Analyzes tone from business description and existing content
 * This can work immediately without external APIs
 */
export const analyzeToneFromBusinessInfo = async (
  businessName: string,
  description?: string,
  existingTone?: string
): Promise<string> => {
  try {
    // Combine available information
    const textToAnalyze = [
      businessName,
      description || "",
    ].filter(Boolean).join(" ");
    
    if (!textToAnalyze) {
      return "Insufficient information to analyze tone. Please provide a description or analyze from website.";
    }
    
    // Basic pattern-based analysis (can be enhanced with AI)
    const lowerText = textToAnalyze.toLowerCase();
    
    let toneCharacteristics: string[] = [];
    
    // Detect formality
    const formalWords = ["professional", "expert", "service", "solutions", "enterprise"];
    const casualWords = ["awesome", "fun", "cool", "hey", "yay"];
    const formalCount = formalWords.filter(w => lowerText.includes(w)).length;
    const casualCount = casualWords.filter(w => lowerText.includes(w)).length;
    
    if (formalCount > casualCount) {
      toneCharacteristics.push("professional");
    } else if (casualCount > formalCount) {
      toneCharacteristics.push("casual");
    } else {
      toneCharacteristics.push("balanced");
    }
    
    // Detect enthusiasm
    if (lowerText.includes("!") || lowerText.includes("exciting") || lowerText.includes("amazing")) {
      toneCharacteristics.push("enthusiastic");
    }
    
    // Detect friendliness
    if (lowerText.includes("help") || lowerText.includes("support") || lowerText.includes("you")) {
      toneCharacteristics.push("friendly");
    }
    
    // Detect expertise
    if (lowerText.includes("expert") || lowerText.includes("years") || lowerText.includes("experience")) {
      toneCharacteristics.push("authoritative");
    }
    
    if (toneCharacteristics.length === 0) {
      toneCharacteristics.push("neutral");
    }
    
    const toneDescription = toneCharacteristics.join(", ");
    
    // If AI API is available, enhance with AI analysis
    if (process.env.NEXT_PUBLIC_AI_API_KEY && description) {
      // TODO: Add AI analysis here
      // For now, return pattern-based analysis
    }
    
    return `Communication style appears to be ${toneDescription}. This is a basic analysis - for more accurate results, analyze from website content or social media posts.`;
  } catch (error) {
    console.error("Error analyzing business info tone:", error);
    throw new Error("Failed to analyze tone from business information.");
  }
};

