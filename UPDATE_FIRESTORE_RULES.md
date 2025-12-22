# Update Firestore Rules to Fix Cron Job Permissions

The cron job needs to access Firestore without user authentication. You need to update your Firestore security rules.

## Quick Steps

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select your project**
3. **Go to Firestore Database** → **Rules** tab
4. **Copy the updated rules** from `firestore.rules` file (in your project)
5. **Paste into Firebase Console**
6. **Click "Publish"**
7. **Wait 10-30 seconds** for rules to propagate

## What Changed

The updated rules allow:
- ✅ **Reading scheduled posts** without authentication (so cron can find posts to publish)
- ✅ **Updating scheduled posts** to "published" or "failed" without authentication
- ✅ **Reading Facebook connections** for scheduled post publishing
- ✅ **Still maintains security** - users can only access their own data
- ✅ **Prevents abuse** - only allows status changes, not modifying other fields

## Security Notes

⚠️ **Important**: These rules allow limited unauthenticated access for the cron job. For production, consider:
- Using Firebase Admin SDK (more secure)
- Adding additional verification (IP whitelist, secret tokens)
- Monitoring for unauthorized access

The current rules are a good balance of security and functionality, but Admin SDK is recommended for production.

## After Updating Rules

1. Wait for rules to propagate (10-30 seconds)
2. Test the cron job by visiting: `https://your-app.vercel.app/api/posts/publish-scheduled`
3. Check that it can now read scheduled posts without errors

## Verify It Works

Check your Vercel deployment logs:
1. Go to Vercel Dashboard → Your Project → Functions → `/api/posts/publish-scheduled`
2. Click on a recent execution
3. Check the logs - you should no longer see permission errors

