# How to Check Cron Job Logs in Vercel

When posts fail to publish, you can check the logs to see what went wrong.

## Viewing Logs in Vercel Dashboard

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`velocity`)
3. Click on the **"Logs"** tab (or go to the **"Deployments"** tab and click on a deployment)
4. Look for logs with the prefix `[Publish Scheduled]`

## What to Look For

The logs will show:
- `[Publish Scheduled] Post {id} failed: {reason}` - When a post fails
- `[Publish Scheduled] Post details:` - Debug information about the post
- `[Publish Scheduled] Facebook connection details:` - Information about the Facebook connection
- `[Publish Scheduled] Facebook API error:` - Facebook API errors

## Common Failure Reasons

1. **No Facebook connection found for business {id}**
   - Solution: Make sure you've connected Facebook to the business on the business detail page

2. **Facebook connection exists but no access token**
   - Solution: Reconnect Facebook - the token may have expired

3. **No page ID found for business {id}**
   - Solution: Make sure the Facebook connection includes a page ID

4. **Facebook API error: {error message}**
   - This could be:
     - Token expired (reconnect Facebook)
     - Invalid permissions (check Facebook app permissions)
     - Page not found (verify the page ID is correct)

## Viewing Failure Reasons in the UI

After the update, failed posts will now show a red error box with the failure reason directly in the posts list. You don't need to check logs for basic error messages - they're displayed in the UI!

## Testing the Cron Job Manually

You can also test the cron job manually by visiting:
```
https://your-app.vercel.app/api/posts/publish-scheduled
```

This will trigger the publishing process and return a JSON response with results.

