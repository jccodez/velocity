# How to Import Your Project to Vercel

If you don't see any deployments, you need to **import your project** first.

## Step-by-Step Import Process

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Make sure you're logged in

### Step 2: Import Project
1. Click the **"Add New..."** button (top right)
2. Select **"Project"** from the dropdown
3. You should see a list of your GitHub repositories

### Step 3: Find Your Repository
Look for: **`jccodez/velocity`**

**If you DON'T see it:**
- Click **"Adjust GitHub App Permissions"** or **"Configure GitHub App"**
- Make sure Vercel has access to your repositories
- Grant access to the `velocity` repository
- Refresh the page

### Step 4: Import the Repository
1. Click on **`jccodez/velocity`**
2. Click the **"Import"** button

### Step 5: Configure Project (Before Deploying!)

**IMPORTANT:** Before clicking "Deploy", configure these settings:

#### A. Framework Settings (should auto-detect)
- Framework Preset: **Next.js** ✅
- Root Directory: **`./`** (default)
- Build Command: **`npm run build`** (default)
- Output Directory: **`.next`** (default)
- Install Command: **`npm install`** (default)

#### B. Environment Variables (CRITICAL!)
Click **"Environment Variables"** and add these 9 variables:

**Firebase (6 variables):**
1. `NEXT_PUBLIC_FIREBASE_API_KEY` = (your value)
2. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = (your value)
3. `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = (your value)
4. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = (your value)
5. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = (your value)
6. `NEXT_PUBLIC_FIREBASE_APP_ID` = (your value)

**Facebook (2 variables):**
7. `FACEBOOK_APP_ID` = (your value)
8. `FACEBOOK_APP_SECRET` = (your value)

**OpenAI (1 variable):**
9. `OPENAI_API_KEY` = (your value)

**For each variable:**
- Paste the value from your `.env.local` file
- Check all three: **Production**, **Preview**, **Development**
- Click **"Add"**

### Step 6: Deploy
1. After adding all environment variables
2. Click the **"Deploy"** button
3. Wait 2-3 minutes for the build to complete

### Step 7: Get Your URL
After deployment completes, you'll see:
- ✅ **Ready** status
- Your deployment URL: `https://velocity-xxxxx.vercel.app`

## If You Still Don't See the Repository

### Option 1: Check GitHub Connection
1. Go to Vercel Dashboard → Settings → Git
2. Make sure GitHub is connected
3. Check repository access permissions

### Option 2: Manual Import via CLI
If the dashboard isn't working, use the CLI:

```bash
# Login to Vercel
npx vercel login

# Deploy (this will create the project)
npx vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? velocity (or leave default)
# - Directory? ./
# - Override settings? No

# Then add environment variables
npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# (repeat for all 9 variables)

# Deploy to production
npx vercel --prod
```

## After First Deployment

1. **Update App URL:**
   - Copy your Vercel URL
   - Add environment variable: `NEXT_PUBLIC_APP_URL` = `https://your-url.vercel.app`
   - Redeploy

2. **Update Facebook Redirect URI:**
   - Go to Facebook Developers Console
   - Add: `https://your-url.vercel.app/api/facebook/callback`

3. **Verify Cron Job:**
   - In Vercel dashboard → Your project → Crons tab
   - Should see `/api/posts/publish-scheduled` running every minute

## Still Having Issues?

If you still can't see the repository or import the project:
1. Check that the repository is public (or Vercel has access)
2. Verify you're logged into the correct Vercel account
3. Try disconnecting and reconnecting GitHub in Vercel settings
4. Check GitHub repository settings → Webhooks to see if Vercel is connected

