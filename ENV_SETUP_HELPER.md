# Environment Variables Setup Helper

## Current Status

Your `.env.local` file exists and contains:
- ✅ Firebase configuration (NEXT_PUBLIC_*)
- ✅ Facebook API keys
- ❌ **OPENAI_API_KEY is missing**

## How to Add Your OpenAI API Key

1. **Open `.env.local`** in your project root directory

2. **Add this line** (replace with your actual key):
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

3. **Important Formatting:**
   - ✅ **Correct**: `OPENAI_API_KEY=sk-abc123...`
   - ❌ **Wrong**: `OPENAI_API_KEY = sk-abc123...` (no spaces around =)
   - ❌ **Wrong**: `OPENAI_API_KEY="sk-abc123..."` (no quotes needed)
   - ❌ **Wrong**: `OPENAI_API_KEY='sk-abc123...'` (no quotes needed)

4. **Save the file**

5. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## Verify It's Working

After restarting, try generating a post. If you still get an error, check:

1. **Is the key correct?** It should start with `sk-` and be ~51 characters
2. **Did you save the file?** Make sure the file was actually saved
3. **Did you restart the server?** Environment variables are only loaded on server start
4. **Check for typos:** Make sure it says `OPENAI_API_KEY` (not `OPEN_AI_API_KEY` or `OPENAI_KEY`)

## Example .env.local File

Your complete `.env.local` should look something like this:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Facebook API
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Still Having Issues?

If the key still doesn't work after following these steps:

1. Double-check you copied the entire key (no missing characters at the end)
2. Verify your OpenAI account has credits/usage limits set
3. Check the server console logs for more detailed error messages

