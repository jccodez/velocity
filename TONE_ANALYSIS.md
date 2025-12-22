# Tone of Voice Analysis Guide

## 🎯 How It Works

The software can automatically learn your business's tone of voice from:
1. **Business Description** - Analyzes the language and style you use
2. **Website Content** - (Coming soon) Scrapes and analyzes your website
3. **Social Media Posts** - (Coming soon) Analyzes your existing posts

## 🚀 Using Tone Analysis

### Step 1: Go to Your Business Detail Page
1. Navigate to **Dashboard → Businesses**
2. Click on the business you want to analyze
3. Scroll to the **"Tone of Voice"** section

### Step 2: Analyze the Tone
You'll see two buttons:

- **"Analyze from Description"** - Analyzes tone from your business description
- **"Analyze from Website"** - Analyzes tone from your website (if URL is provided)

### Step 3: Review and Use
Once analyzed, the tone will be:
- ✅ Saved to your business profile
- ✅ Automatically used when generating AI content
- ✅ Displayed on your business page

## 🔍 Current Analysis Features

The current implementation uses **pattern-based analysis** that detects:
- **Formality level** (professional, casual, balanced)
- **Enthusiasm** (based on exclamation marks and energetic words)
- **Friendliness** (based on supportive language)
- **Authority** (based on expertise indicators)

### Example Output:
```
Communication style appears to be professional, friendly, authoritative. 
This is a basic analysis - for more accurate results, analyze from 
website content or social media posts.
```

## 🚧 Enhanced AI Analysis (Future)

For production use, you can enhance this with real AI APIs:

### Option 1: OpenAI GPT-4
1. Add your OpenAI API key to `.env.local`:
   ```env
   NEXT_PUBLIC_OPENAI_API_KEY=sk-...
   ```

2. Update `lib/ai/contentGenerator.ts` to use OpenAI API

### Option 2: Anthropic Claude
1. Add your Anthropic API key to `.env.local`:
   ```env
   NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
   ```

### Option 3: Server-Side API Route (Recommended)

For better security and to avoid CORS issues, create an API route:

**Create `app/api/analyze-tone/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { text, source } = await request.json();
  
  // Call your AI service here
  // Example with OpenAI:
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'Analyze the tone of voice and communication style. Provide a 2-3 sentence description.'
      }, {
        role: 'user',
        content: `Analyze the tone from this ${source}: ${text}`
      }]
    })
  });
  
  const data = await response.json();
  return NextResponse.json({ tone: data.choices[0].message.content });
}
```

Then update `analyzeToneFromWebsite` to call this API route.

## 📝 Manual Tone Entry

You can also manually set or edit the tone:

1. Go to business detail page
2. Click **"Edit"** button
3. Edit the tone of voice field
4. Save changes

## 🎨 Using Learned Tone

Once analyzed, the tone is automatically used when:
- ✨ Generating AI content for posts
- 📊 Creating campaign messages
- 📱 Writing social media posts

The AI will match your business's communication style!

## 🔄 Re-analyzing Tone

You can re-analyze tone anytime:
- After updating your business description
- After changing your website
- As your business evolves

Just click the analyze button again to update the tone.

## 💡 Tips for Better Tone Analysis

1. **Write detailed descriptions** - More content = better analysis
2. **Be authentic** - Use your actual business voice in descriptions
3. **Include examples** - Add sample copy or taglines if possible
4. **Analyze from website** - Websites usually have more content to analyze

## 🐛 Troubleshooting

### "Failed to analyze tone" error
- Make sure your business has a description
- Check your internet connection
- Try the "Analyze from Description" option first

### Website analysis not working
- Website may have CORS restrictions
- Create a server-side API route (see Enhanced AI Analysis above)
- For now, use "Analyze from Description" as a workaround

### Tone seems inaccurate
- The current implementation uses basic pattern matching
- For better results, integrate with OpenAI/Anthropic API
- You can always manually edit the tone after analysis

