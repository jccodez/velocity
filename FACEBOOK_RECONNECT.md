# Facebook Reconnection Required

## Issue

Your Facebook connection is missing the `pages_manage_posts` permission, which is required to publish posts to Facebook pages.

## Solution

You need to **reconnect Facebook** to get the updated permissions:

1. Go to your business detail page: `/dashboard/businesses/{businessId}`
2. If Facebook is already connected, **disconnect it first** (click "Disconnect Facebook")
3. Click **"Connect Facebook"** again
4. Facebook will ask for new permissions - make sure to approve `pages_manage_posts`
5. Select the page you want to connect

## What Changed

The Facebook connection now requests the `pages_manage_posts` permission, which is required by Facebook to publish posts to pages. This permission was missing before, which caused posts to fail with error code 200.

## After Reconnecting

Once you reconnect with the new permissions:
- The page access token will be stored (this is different from user token)
- Posts should publish successfully
- The error message will no longer appear

## Why This Happened

Facebook requires specific permissions to post to pages:
- `pages_manage_posts` - Create and publish posts (NEW - was missing)
- `pages_read_engagement` - Read engagement metrics
- `pages_show_list` - List pages you manage

The previous connection didn't request `pages_manage_posts`, so posts failed even though the connection appeared successful.

