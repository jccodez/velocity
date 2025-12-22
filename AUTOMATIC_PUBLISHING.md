# Automatic Post Publishing Setup

Currently, scheduled posts are saved with a `scheduledDate`, but **they will NOT automatically publish** until you set up the automation system.

## Current Status

✅ **Working:**
- Creating scheduled posts
- Viewing scheduled posts in the Schedule page
- Posts are saved with status "scheduled"

❌ **Not Working Yet:**
- Automatic publishing at scheduled time
- Posts remain in "scheduled" status until manually published

## How Automatic Publishing Works

An API endpoint has been created at `/api/posts/publish-scheduled` that:
1. Finds all posts with status "scheduled" that have passed their `scheduledDate`
2. Publishes them to the connected social media platform (Facebook, etc.)
3. Updates the post status to "published" or "failed"

**This endpoint needs to be called periodically** (e.g., every minute) to check for and publish scheduled posts.

## Setup Options

### Option 1: External Cron Service (Recommended for Production)

Use a service like:
- **Cron-Job.org** (free): https://cron-job.org/
- **EasyCron**: https://www.easycron.com/
- **Vercel Cron Jobs** (if deploying to Vercel): Built-in cron support

**Setup with Cron-Job.org:**
1. Sign up at https://cron-job.org/
2. Create a new cron job
3. Set the URL to: `https://your-domain.com/api/posts/publish-scheduled`
4. Set schedule to run every minute: `* * * * *`
5. Save and activate

### Option 2: Server-Side Cron (If you have a server)

If you're running your own server, you can set up a cron job:

```bash
# Add to crontab (crontab -e)
* * * * * curl https://your-domain.com/api/posts/publish-scheduled
```

### Option 3: Vercel Cron (If using Vercel)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/posts/publish-scheduled",
    "schedule": "* * * * *"
  }]
}
```

### Option 4: Manual Testing (For Development)

For testing, you can manually trigger the endpoint:

```bash
curl http://localhost:3000/api/posts/publish-scheduled
```

Or visit: `http://localhost:3000/api/posts/publish-scheduled` in your browser

## Important Notes

1. **The endpoint needs to be publicly accessible** (not just localhost) for external cron services to work
2. **For production**, make sure to add authentication/security to prevent unauthorized access
3. **The endpoint checks posts every time it's called** - running it every minute is recommended
4. **Posts are checked against the current time** - any post with `scheduledDate <= now` will be published

## Adding Security (Recommended)

For production, you should add a secret token to prevent unauthorized access:

1. Add to `.env.local`:
```env
PUBLISH_CRON_SECRET=your-random-secret-here
```

2. Update the API route to check for this secret in the request headers or query params

3. Configure your cron service to include this secret when calling the endpoint

## Current Limitations

- Only Facebook publishing is implemented
- Other platforms (Instagram, Twitter, LinkedIn) need to be added
- No retry logic for failed posts
- No notification system when posts fail

## Testing

1. Create a scheduled post for a time in the past (e.g., 1 minute ago)
2. Wait a moment
3. Call the publish endpoint manually: `GET /api/posts/publish-scheduled`
4. Check that the post status changed to "published" or "failed"
5. Verify the post appeared on Facebook

