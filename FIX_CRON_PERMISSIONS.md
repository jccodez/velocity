# Fix Cron Job Firestore Permissions

The cron job is getting permission errors because it runs without user authentication. Here's how to fix it:

## Option 1: Update Firestore Rules (Quick Fix)

I've updated the `firestore.rules` file to allow:
- Reading posts with status "scheduled" (for cron to find posts to publish)
- Updating scheduled posts to "published" or "failed" (for cron to update status)
- Reading Facebook connections when verifying business ownership

**Steps:**
1. Open `firestore.rules` in your project
2. Copy the updated rules
3. Go to Firebase Console → Firestore Database → Rules
4. Paste the updated rules
5. Click **"Publish"**
6. Wait 10-30 seconds for rules to propagate

## Option 2: Use Firebase Admin SDK (More Secure - Recommended)

For better security in production, use Firebase Admin SDK which bypasses security rules:

### Setup:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click **"Generate New Private Key"**
3. Download the JSON file
4. Add to Vercel environment variables as `FIREBASE_SERVICE_ACCOUNT` (as JSON string)
5. Update the cron route to use Admin SDK instead of client SDK

### Implementation (Future Enhancement):
```typescript
// Use Firebase Admin SDK in publish-scheduled route
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
// Now you can read/write without security rules blocking
```

## Current Solution

The updated rules allow:
- ✅ Cron job to read scheduled posts
- ✅ Cron job to update post status (published/failed)
- ✅ Cron job to read Facebook connections (for publishing)
- ✅ Still maintains user data security

## Deploy Updated Rules

**Quick steps:**
1. Copy the rules from `firestore.rules` file
2. Go to Firebase Console → Firestore Database → Rules
3. Paste and click **"Publish"**
4. Test the cron job again

The cron job should now work without permission errors!

