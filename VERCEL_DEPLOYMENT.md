# Deploying to Vercel

This guide will walk you through deploying your Velocity app to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your project pushed to GitHub, GitLab, or Bitbucket (recommended)
3. All your environment variables ready

## Step 1: Push to GitHub (if not already)

If you haven't already, create a GitHub repository and push your code:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/velocity.git

# Push to GitHub
git push -u origin main
```

## Step 2: Import Project to Vercel

1. Go to https://vercel.com and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Vercel will auto-detect Next.js settings - keep them as is

## Step 3: Configure Environment Variables

In the Vercel project settings, add all your environment variables:

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Facebook API
```
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### OpenAI API
```
OPENAI_API_KEY=sk-your-openai-api-key
```

### App URL (Update after first deployment)
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important**: 
- Add these in **Project Settings → Environment Variables**
- Make sure to add them to **Production**, **Preview**, and **Development** environments
- For `NEXT_PUBLIC_APP_URL`, you'll need to update it after the first deployment with your actual Vercel URL

## Step 4: Update Facebook Redirect URI

After deployment, you'll get a Vercel URL like `https://your-app.vercel.app`. You need to:

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Settings → Basic**
4. Add your Vercel URL to **Valid OAuth Redirect URIs**:
   ```
   https://your-app.vercel.app/api/facebook/callback
   ```
5. Save changes

6. Update the `NEXT_PUBLIC_APP_URL` environment variable in Vercel to match your deployment URL

## Step 5: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for the build to complete (usually 2-3 minutes)
3. Your app will be live at `https://your-app.vercel.app`

## Step 6: Verify Cron Job

After deployment, verify the cron job is set up:

1. Go to your Vercel project dashboard
2. Click on **"Crons"** tab
3. You should see `/api/posts/publish-scheduled` running every minute
4. Check the logs to ensure it's working

## Step 7: Test Your Deployment

1. **Test Authentication**: Sign up/login to verify Firebase Auth works
2. **Test Facebook Connection**: Connect a Facebook page in Settings
3. **Test Post Creation**: Create a post and verify it saves
4. **Test AI Generation**: Generate an AI post to verify OpenAI works
5. **Test Scheduling**: Schedule a post for 1 minute in the future, wait, then check if it published

## Troubleshooting

### Build Errors

If you get build errors:
- Check that all environment variables are set
- Verify your `package.json` has all dependencies
- Check the build logs in Vercel for specific errors

### Cron Job Not Running

- Verify `vercel.json` is committed to your repository
- Check Vercel dashboard → Crons tab
- Look at cron job logs for errors

### Environment Variables Not Working

- Make sure you added them in the correct environment (Production/Preview/Development)
- Redeploy after adding new environment variables
- Variables starting with `NEXT_PUBLIC_` are available on the client side
- Other variables are server-side only

### Facebook OAuth Not Working

- Verify redirect URI is added in Facebook app settings
- Make sure `NEXT_PUBLIC_APP_URL` matches your Vercel deployment URL
- Check that `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` are correct

### Firebase Permission Errors

- Make sure your Firestore security rules are deployed
- Verify Firebase project settings allow your Vercel domain
- Check Firebase console for any blocked requests

## Updating Your Deployment

Every time you push to your main branch, Vercel will automatically:
- Build your project
- Run tests (if configured)
- Deploy to production

For preview deployments:
- Every pull request gets its own preview URL
- Preview deployments use the same environment variables as production (unless overridden)

## Custom Domain (Optional)

To use your own domain:

1. Go to **Project Settings → Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update Facebook redirect URI to use your custom domain

## Monitoring

- **Analytics**: Vercel provides built-in analytics for your deployments
- **Logs**: Check function logs in Vercel dashboard
- **Cron Logs**: Monitor cron job execution in the Crons tab

## Cost

Vercel's free tier includes:
- 100GB bandwidth
- 100 serverless function executions per day
- Unlimited static assets
- Preview deployments

For higher traffic, consider the Pro plan ($20/month).

## Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- All secrets should be in Vercel environment variables
- Use different API keys for development vs production when possible
- Regularly rotate your API keys

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

