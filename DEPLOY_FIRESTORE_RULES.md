# Deploy Firestore Rules

The Firestore security rules have been updated to fix the permission error when loading scheduled posts.

## Quick Deploy (Firebase CLI)

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:rules
```

## Manual Deploy (Firebase Console)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents of `firestore.rules` file
6. Paste into the rules editor
7. Click **Publish**

## What Changed

The rules now allow users to read posts if:
- They own the post directly (via `userId` field), OR
- They own the business that the post belongs to (via `businessId`)

This fixes the issue where users couldn't see their scheduled posts when querying by `businessId`.

