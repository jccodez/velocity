# Fix Duplicate Vercel Deployments

You have two Vercel projects deploying from the same GitHub repository:
- `social-posts` 
- `velocity`

This causes every push to trigger two deployments. Here's how to fix it:

## Solution: Keep Velocity Project

**Disconnect `social-posts` and keep `velocity`:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find the `social-posts` project
3. Click on the project
4. Go to **Settings** → **Git**
5. Click **Disconnect** next to the GitHub repository
6. Confirm the disconnection

### (Optional) Delete the social-posts Project

If you're sure you don't need the old project:
1. In the project settings, scroll to the bottom
2. Click **Delete Project**
3. Type the project name to confirm
4. Click **Delete**

## Why Keep Velocity?

1. The project name `velocity` matches your rebranded application
2. Having one deployment is simpler and faster
3. Reduces confusion and deployment costs

## After Fixing

Once you disconnect one project:
- Only one deployment will trigger per push
- Your deployments will be faster
- You'll have less confusion about which URL to use

## Verify

After disconnecting:
1. Make a small change (like adding a comment)
2. Push to GitHub
3. Check Vercel dashboard - you should see only ONE deployment

