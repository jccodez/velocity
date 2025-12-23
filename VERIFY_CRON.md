# How to Verify Cron Job is Running

## Check if Cron Job is Configured

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on the **"Crons"** tab (in the top navigation)
4. You should see: `/api/posts/publish-scheduled` with schedule `* * * * *`

If you don't see it:
- Make sure `vercel.json` is in your repository
- Redeploy your project
- Cron jobs require Vercel Pro plan ($20/month) - check if you're on the right plan

## Check Cron Job Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Logs"** tab
3. Filter by "Cron" or search for `[Publish Scheduled]`
4. You should see logs every minute when the cron runs

## Test Manually

To verify the route works, visit it manually:
```
https://your-app.vercel.app/api/posts/publish-scheduled
```

This should return JSON like:
```json
{
  "message": "No posts to publish",
  "count": 0,
  "scheduledPostsFound": 1,
  "info": "1 post(s) scheduled but not ready yet"
}
```

If you get an error, that will help us debug.

## Check if Route is Being Called

The route now logs when it's called. Check the logs for:
```
[Publish Scheduled] Route called at {timestamp}
[Publish Scheduled] Request headers: { ... }
```

If you don't see this log, the cron job isn't calling the route.

## Common Issues

### Cron Job Not Showing in Dashboard
- Make sure `vercel.json` is committed to git
- Redeploy after adding `vercel.json`
- Check you're on Vercel Pro plan (required for cron jobs)

### No Logs Appearing
- Wait a few minutes (cron runs every minute)
- Check the "Logs" tab, not "Build Logs"
- Filter by "Cron" in the logs
- Try the manual test URL to see if route works

### Route Returns 404
- Make sure the file exists at: `app/api/posts/publish-scheduled/route.ts`
- Make sure it exports a `GET` function
- Redeploy if you just added it

