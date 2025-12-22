# Vercel Deployment Troubleshooting

## Build Status Check

Your local build is **succeeding** ✅. The "Error publishing scheduled posts" message during build is expected and won't block deployment - it's just the API route trying to access Firestore during build (which fails without auth context).

## Common Vercel Deployment Issues

### 1. "Build Failed" Error

**Check the build logs in Vercel dashboard:**
1. Go to your project in Vercel
2. Click on the failed deployment
3. Click "View Build Logs"
4. Look for specific error messages

**Common causes:**
- Missing environment variables
- Node.js version mismatch
- Build timeout
- Memory limit exceeded

### 2. Environment Variables Not Set

**Make sure you added ALL these variables:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `OPENAI_API_KEY`

**To add them:**
1. Project Settings → Environment Variables
2. Add each variable
3. Select all environments: Production, Preview, Development
4. Click "Save"
5. **Redeploy** after adding variables

### 3. Repository Not Connected

**If deployment isn't starting:**
1. Check that Vercel is connected to GitHub
2. Verify the repository name matches: `jccodez/velocity`
3. Check GitHub repository settings → Webhooks to see if Vercel webhook exists

### 4. Build Command Issues

**Verify build settings in Vercel:**
- Framework Preset: Next.js
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)
- Node.js Version: 18.x or 20.x

### 5. TypeScript/ESLint Errors Blocking Build

If you see TypeScript or ESLint errors:
- Check the build logs for specific file and line numbers
- Fix the errors locally
- Test with `npm run build`
- Commit and push fixes

### 6. Cron Job Configuration Error

If you see errors about `vercel.json`:
- Verify `vercel.json` is in the root directory
- Check JSON syntax is valid
- Note: Cron jobs require Vercel Pro plan ($20/month)

### 7. Memory/Timeout Issues

If build times out:
- Check build logs for memory errors
- Consider upgrading to Vercel Pro plan
- Optimize build process (split large dependencies)

## Quick Diagnostic Steps

1. **Check local build:**
   ```bash
   npm run build
   ```
   Should complete successfully.

2. **Verify git push:**
   ```bash
   git log -1
   git remote -v
   ```
   Should show recent commits and correct remote.

3. **Check Vercel dashboard:**
   - Is the project imported?
   - Are environment variables added?
   - What's the latest deployment status?
   - What do the build logs say?

4. **Test deployment manually:**
   ```bash
   npx vercel --prod
   ```
   This will show you exactly what Vercel sees.

## Getting Help

If you're still stuck, please share:
1. The exact error message from Vercel build logs
2. Screenshot of the deployment page
3. Any error messages you see

You can find build logs at:
- Vercel Dashboard → Your Project → Deployments → Click on deployment → "View Build Logs"

