# Facebook Tone Analysis Setup

## Overview

Yes! The software can learn your business tone from Facebook posts. Currently, it's set up to work with Facebook, but requires Facebook Graph API integration.

## Current Status

✅ **UI is ready** - The "Analyze from Facebook" button appears when you have a Facebook account linked
⚠️ **API Integration needed** - Requires Facebook Graph API setup to fetch posts

## How It Works

When you click "Analyze from Facebook", the system will:
1. Fetch recent posts from your Facebook page
2. Analyze the language, style, and tone patterns
3. Generate a tone description
4. Save it to your business profile

## Setting Up Facebook API (For Developers)

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as app type
4. Fill in app details and create

### Step 2: Get Page Access Token

1. In your app, go to **Tools** → **Graph API Explorer**
2. Select your app
3. Add these permissions:
   - `pages_read_engagement`
   - `pages_read_user_content`
   - `pages_show_list`
4. Generate token
5. Exchange for a long-lived token (60 days)

### Step 3: Get Page ID

1. Go to your Facebook page
2. Click **About** → **Page ID** (or use Graph API Explorer)
3. Note the Page ID

### Step 4: Test API Access

Test in Graph API Explorer:
```
GET /{page-id}/posts?fields=message,created_time&limit=10
```

## Implementation Guide

To enable Facebook analysis, you'll need to:

### Option 1: Add to Environment Variables

Add to `.env.local`:
```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_ACCESS_TOKEN=your_page_access_token
```

### Option 2: OAuth Flow (Recommended for Production)

Implement Facebook OAuth in Settings:
1. User connects Facebook account
2. Store access token securely
3. Use token to fetch posts when analyzing

### Option 3: Manual Post Entry (Quick Test)

For testing, you could manually provide sample posts:
- Add a text input to paste recent posts
- Analyze those directly

## Code Implementation

The framework is already in place in `lib/ai/contentGenerator.ts`. You need to:

1. **Uncomment and implement the Facebook API call** in `analyzeToneFromFacebook()`
2. **Add error handling** for API failures
3. **Store access tokens** securely (in database or environment)
4. **Create API route** to handle Facebook requests server-side (to keep tokens secure)

### Example Implementation:

```typescript
export const analyzeToneFromFacebook = async (
  pageIdOrUsername: string,
  accessToken?: string
): Promise<string> => {
  // Get token from environment or user's stored tokens
  const token = accessToken || process.env.FACEBOOK_ACCESS_TOKEN;
  
  if (!token) {
    throw new Error("Facebook access token required. Connect Facebook in Settings.");
  }
  
  // Fetch posts
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageIdOrUsername}/posts?fields=message,created_time&limit=20&access_token=${token}`
  );
  
  const data = await response.json();
  const posts = data.data || [];
  
  // Extract text
  const postTexts = posts.map(p => p.message).filter(Boolean);
  
  // Analyze tone
  return await analyzeTextTone(postTexts.join('\n\n'));
};
```

## Alternative: Manual Facebook Analysis

For now, you can:

1. **Copy recent Facebook posts** manually
2. **Use "Analyze from Description"** and paste sample posts into business description
3. **Or wait for API integration** to be fully implemented

## Future Enhancements

Planned features:
- 🔐 OAuth connection in Settings page
- 📊 Automatic post fetching
- 🎯 Real-time tone updates as you post
- 📈 Tone evolution tracking over time
- 🔄 Multi-platform aggregation (combine Facebook + Instagram + Twitter)

## Security Notes

⚠️ **Important:**
- Never expose access tokens in client-side code
- Use server-side API routes for Facebook API calls
- Store tokens securely (encrypted in database)
- Implement token refresh for long-lived tokens
- Follow Facebook's data use policies

## Need Help?

- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- [Facebook Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [OAuth Setup Guide](https://developers.facebook.com/docs/facebook-login/web)

