# Quick Deploy to Vercel - Step by Step

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Import Project
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Find your repository: `jccodez/velocity`
4. Click **"Import"**

### Step 2: Configure Project Settings
Vercel should auto-detect Next.js. Verify these settings:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 3: Add Environment Variables
**IMPORTANT**: Add these BEFORE clicking Deploy!

Click **"Environment Variables"** and add each one:

#### Firebase (6 variables):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

#### Facebook (2 variables):
```
FACEBOOK_APP_ID
FACEBOOK_APP_SECRET
```

#### OpenAI (1 variable):
```
OPENAI_API_KEY
```

**For each variable:**
- Paste the value from your `.env.local` file
- Check all three environments: Production, Preview, Development
- Click "Add"

### Step 4: Deploy
1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://velocity-xxxxx.vercel.app`

### Step 5: Update App URL (After First Deployment)
1. Copy your Vercel deployment URL
2. Go to **Project Settings → Environment Variables**
3. Add/Update: `NEXT_PUBLIC_APP_URL` = `https://your-actual-url.vercel.app`
4. Redeploy (or it will auto-redeploy)

### Step 6: Update Facebook Redirect URI
1. Go to https://developers.facebook.com/apps/
2. Select your Facebook app
3. Go to **Settings → Basic**
4. Add to **Valid OAuth Redirect URIs**:
   ```
   https://your-actual-url.vercel.app/api/facebook/callback
   ```
5. Save changes

### Step 7: Verify Cron Job
1. In Vercel dashboard, go to your project
2. Click **"Crons"** tab
3. You should see: `/api/posts/publish-scheduled` running every minute

---

## Option 2: Deploy via Vercel CLI

If you prefer command line:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# ... (add all other variables)

# Deploy to production
vercel --prod
```

---

## Troubleshooting

### Build Fails
- Check that all environment variables are added
- Verify Node.js version (should be 18+)
- Check build logs in Vercel dashboard

### Environment Variables Not Working
- Make sure you added them to Production, Preview, AND Development
- Redeploy after adding new variables
- Variables starting with `NEXT_PUBLIC_` are client-side accessible

### Cron Job Not Showing
- Make sure `vercel.json` is in your repository
- Check that you're on a paid plan (cron jobs require Pro plan on Vercel)
- Wait a few minutes after deployment

### Facebook OAuth Not Working
- Verify redirect URI is updated in Facebook app settings
- Make sure `NEXT_PUBLIC_APP_URL` matches your Vercel URL
- Check that Facebook app is in "Live" mode (not Development)

---

## Quick Checklist

- [ ] Project imported in Vercel
- [ ] All environment variables added (9 total)
- [ ] Deployed successfully
- [ ] Got deployment URL
- [ ] Updated `NEXT_PUBLIC_APP_URL` with actual URL
- [ ] Updated Facebook redirect URI
- [ ] Verified cron job is running
- [ ] Tested login/signup
- [ ] Tested Facebook connection
- [ ] Tested AI post generation

