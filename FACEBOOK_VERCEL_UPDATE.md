# Update Facebook App Settings for Vercel Deployment

After deploying to Vercel, you need to update your Facebook app's redirect URI to allow authentication from your production URL.

## Step 1: Get Your Vercel URL

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your project
3. Copy your deployment URL (e.g., `https://velocity-xxxxx.vercel.app` or your custom domain)

## Step 2: Update Facebook App Settings

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app from the list
3. In the left sidebar, click **"Settings"** → **"Basic"**

## Step 3: Add Valid OAuth Redirect URIs

Scroll down to the **"Settings"** section and find:
- **"Valid OAuth Redirect URIs"** field
- **"App Domains"** field (optional but recommended)

### Add to Valid OAuth Redirect URIs:

Add both your local and production URLs:

```
http://localhost:3000/api/facebook/callback
https://your-app-name.vercel.app/api/facebook/callback
```

**Important:**
- Replace `your-app-name.vercel.app` with your actual Vercel URL
- Each URL should be on a new line
- Make sure to include the `/api/facebook/callback` path exactly

### Add to App Domains (Optional):

Add your domain without `https://`:

```
your-app-name.vercel.app
```

## Step 4: Update Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add or update: `NEXT_PUBLIC_APP_URL`
3. Set the value to your Vercel URL: `https://your-app-name.vercel.app`
4. Make sure it's set for **Production**, **Preview**, and **Development**
5. Click **"Save"**

## Step 5: Redeploy (if needed)

If you just added `NEXT_PUBLIC_APP_URL`, you may need to redeploy:
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **"Redeploy"**

Or just push a new commit to trigger automatic deployment.

## Step 6: Test Facebook Connection

1. Visit your Vercel deployment URL
2. Log in to your app
3. Go to **Dashboard** → **Settings**
4. Click **"Connect Facebook"**
5. Complete the Facebook authorization
6. Verify it connects successfully

## Troubleshooting

### "Invalid Redirect URI" Error

If you get this error:
1. Double-check the redirect URI in Facebook settings
2. Make sure it matches exactly: `https://your-url.vercel.app/api/facebook/callback`
3. Make sure `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
4. Wait a few minutes after updating Facebook settings (can take time to propagate)

### App Not in Live Mode

Make sure your Facebook app is in **Live Mode** (not Development mode):
1. Go to Facebook App Dashboard
2. Top of the page shows app mode
3. If it says "Development", click **"Switch Mode"** → **"Live"**
4. You may need to complete App Review for certain permissions

### Local Development Still Works

You should have both URLs in the redirect URIs:
- `http://localhost:3000/api/facebook/callback` (for local dev)
- `https://your-app.vercel.app/api/facebook/callback` (for production)

This way both environments work!

## Quick Checklist

- [ ] Got Vercel deployment URL
- [ ] Updated Facebook App → Settings → Valid OAuth Redirect URIs
- [ ] Added production URL: `https://your-url.vercel.app/api/facebook/callback`
- [ ] Updated `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- [ ] Redeployed (if needed)
- [ ] Tested Facebook connection on production site

