# Troubleshooting Scheduled Posts

If scheduled posts aren't being published, check the following:

## 1. Check Vercel Logs

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on **"Logs"** tab
4. Look for entries with `[Publish Scheduled]` prefix

You should see logs like:
- `[Publish Scheduled] Found X scheduled post(s) in database`
- `[Publish Scheduled] Post {id}: scheduled for {time}, READY NOW` or `X minutes`
- `[Publish Scheduled] Processing post {id} for business {businessId}`
- `[Publish Scheduled] Publishing post {id} to Facebook page {pageId}`
- `[Publish Scheduled] Successfully published post {id} to Facebook`

If you see errors, they'll show what's failing.

## 2. Common Issues

### No Posts Found
- Check that posts have `status: "scheduled"`
- Verify `scheduledDate` is set
- Make sure the scheduled time has passed (cron runs every minute)

### Facebook Connection Error
Look for: `[Publish Scheduled] Post {id} failed to get Facebook connection`
- This means the cron job couldn't read the Facebook connection from Firestore
- Check that Facebook is connected to the business
- Verify Firestore rules allow unauthenticated reads for `facebook_connections`

### Facebook API Error
Look for: `[Publish Scheduled] Failed to publish post {id}`
- Check the error message - it will show the Facebook API error
- Common issues:
  - Token expired (need to reconnect Facebook)
  - Missing permissions (need `pages_manage_posts`)
  - Invalid page ID

### Permission Errors
Look for: `Missing or insufficient permissions`
- The Firestore rules should allow:
  - Reading posts with `status == "scheduled"` (without auth)
  - Reading `facebook_connections` if business exists (without auth)
  - Updating posts from "scheduled" to "published"/"failed" (without auth)

## 3. Test the Cron Job Manually

You can manually trigger the cron job by visiting:
```
https://your-app.vercel.app/api/posts/publish-scheduled
```

This will show you the JSON response with details about what happened.

## 4. Verify Your Scheduled Post

Make sure your post:
- Has `status: "scheduled"` (not "draft")
- Has a `scheduledDate` set
- The `scheduledDate` is in the past (posts publish when the time arrives)
- The business has Facebook connected

## 5. Check Firestore Rules

Make sure your `firestore.rules` are deployed and include:
- Allow read of scheduled posts without auth
- Allow read of facebook_connections without auth if business exists
- Allow update of scheduled posts to published/failed without auth

