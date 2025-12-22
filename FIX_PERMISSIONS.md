# Fixing Firestore Permission Errors

## 🔴 If You're Getting "Missing or insufficient permissions"

This means your Firestore security rules need to be updated and deployed.

## Quick Fix - Deploy Rules to Firebase

### Step 1: Copy the Rules

Copy the entire contents of `firestore.rules` file (in your project root).

### Step 2: Deploy to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Firestore Database"** in the left sidebar
4. Click on the **"Rules"** tab at the top
5. **Replace all existing rules** with the rules from `firestore.rules`
6. Click **"Publish"** button

### Step 3: Wait and Refresh

1. Wait 10-30 seconds for rules to propagate
2. Refresh your browser page
3. Try the action again

## Alternative: Using Firebase CLI

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

## What the Rules Do

The rules ensure:
- ✅ Only authenticated users can access data
- ✅ Users can only access their own data
- ✅ `facebook_connections` collection is accessible to each user for their own tokens
- ✅ Businesses, campaigns, and posts are user-scoped

## Testing Rules

After deploying, you can test in Firebase Console:
1. Go to **Firestore Database** → **Rules** tab
2. Click **"Rules Playground"** at the top right
3. Test different scenarios

## Common Issues

### "Rules not working after deploying"
- **Wait**: Rules can take up to 1 minute to propagate
- **Check syntax**: Make sure there are no syntax errors (Firebase will highlight them)
- **Verify project**: Make sure you're in the correct Firebase project

### "Still getting permission errors"
1. **Clear browser cache** and refresh
2. **Check you're logged in** to your app
3. **Verify auth token** is valid (try logging out and back in)
4. **Check browser console** for more specific error messages

### "Rules won't save"
- Make sure you're using the correct Firebase project
- Check for syntax errors (look for red underlines)
- Make sure you clicked "Publish" not just "Save Draft"

## Current Rules Summary

The rules allow:
- ✅ Users to read/write their own businesses
- ✅ Users to read/write their own campaigns  
- ✅ Users to read/write their own posts
- ✅ Users to read/write their own Facebook connections
- ❌ Users cannot access other users' data

## Need Help?

If rules still don't work:
1. Check the exact error message in browser console
2. Verify your Firebase project matches your `.env.local` config
3. Make sure Firestore Database is enabled in Firebase Console
4. Try creating a test document manually in Firebase Console

