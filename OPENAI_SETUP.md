# OpenAI Setup Guide

This guide will help you set up OpenAI API integration for AI-powered post generation.

## Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Give it a name (e.g., "Social Posts App")
6. **Copy the key immediately** - you won't be able to see it again!

## Step 2: Add API Key to Your Project

1. Open your project's `.env.local` file in the root directory
2. Add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important**: 
- Replace `sk-your-actual-api-key-here` with your actual key
- Do NOT commit this file to git (it should already be in `.gitignore`)
- Keep your API key secret and never share it publicly

## Step 3: Restart Your Development Server

After adding the API key, you **must restart** your development server:

1. Stop the current server (press `Ctrl+C` in the terminal)
2. Start it again:
```bash
npm run dev
```

⚠️ **Important**: Environment variables are only loaded when the server starts. If you add or change an environment variable, you need to restart the server for it to take effect.

## Step 4: Verify It Works

1. Go to **Dashboard → Posts → Create New Post**
2. Select a business
3. Select a platform
4. (Optional) Enter a topic
5. Click **"Generate with AI"**

You should see AI-generated content appear in the content field!

## Optional: Choose a Different Model

By default, the app uses `gpt-4o-mini` (fast and cost-effective). You can change this in `.env.local`:

```env
OPENAI_MODEL=gpt-4o-mini  # Default - fast and cheap
# OR
OPENAI_MODEL=gpt-4        # More powerful but slower and more expensive
# OR
OPENAI_MODEL=gpt-3.5-turbo # Good balance
```

## Troubleshooting

### "AI API key not configured" Error

**Solution**: 
1. Check that `OPENAI_API_KEY` is in your `.env.local` file
2. Make sure there are no spaces around the `=` sign
3. **Restart your development server**
4. Verify the key starts with `sk-`

### "Failed to generate post content" Error

**Possible causes**:
1. Invalid API key - double-check you copied it correctly
2. Insufficient API credits - check your OpenAI account balance
3. Network issues - check your internet connection

### Check Your API Key Format

Your OpenAI API key should:
- Start with `sk-`
- Be approximately 51 characters long
- Not have any spaces or line breaks

## Cost Information

OpenAI API usage is pay-as-you-go:
- `gpt-4o-mini`: Very affordable (~$0.15 per million input tokens, $0.60 per million output tokens)
- `gpt-4`: More expensive but higher quality
- `gpt-3.5-turbo`: Good balance of cost and quality

A typical post generation uses about 500-1000 tokens, so costs are very minimal (typically less than $0.001 per post).

Monitor your usage at: https://platform.openai.com/usage

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Never share your API key** publicly
3. **Use environment variables** for all secrets
4. **Rotate your keys** if you suspect they're compromised
5. **Set usage limits** in your OpenAI account settings

## Need Help?

- OpenAI Documentation: https://platform.openai.com/docs
- OpenAI Support: https://help.openai.com/

