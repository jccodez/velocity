# Firestore Security Rules Setup

## 🔒 Quick Fix for Permission Errors

You're seeing "Missing or insufficient permissions" because Firestore security rules need to be configured. Here's how to fix it:

## Option 1: Set Rules in Firebase Console (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**
3. **Click on "Firestore Database"** in the left sidebar
4. **Click on the "Rules" tab** at the top
5. **Replace the default rules** with the rules from `firestore.rules` file (see below)
6. **Click "Publish"**

### Security Rules to Copy:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Businesses collection
    match /businesses/{businessId} {
      // Allow read if user owns the business
      allow read: if isOwner(resource.data.userId);
      
      // Allow create if user is authenticated and sets their userId
      allow create: if isAuthenticated() 
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.name is string;
      
      // Allow update if user owns the business
      allow update: if isOwner(resource.data.userId)
                    && request.resource.data.userId == resource.data.userId;
      
      // Allow delete if user owns the business
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Campaigns collection
    match /campaigns/{campaignId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.name is string;
      allow update: if isOwner(resource.data.userId)
                    && request.resource.data.userId == resource.data.userId;
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.content is string;
      allow update: if isOwner(resource.data.userId)
                    && request.resource.data.userId == resource.data.userId;
      allow delete: if isOwner(resource.data.userId);
    }
  }
}
```

## Option 2: Temporary Development Rules (NOT for Production!)

⚠️ **WARNING:** These rules allow ANY authenticated user to read/write ANY data. Only use for testing!

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## What These Rules Do

The recommended rules:
- ✅ Require users to be authenticated
- ✅ Only allow users to access their own data
- ✅ Validate that userId matches the authenticated user
- ✅ Ensure required fields exist (name for businesses/campaigns, content for posts)

## After Setting Rules

1. **Wait a few seconds** for rules to propagate
2. **Refresh your browser** page
3. **Try creating a business again**

## Troubleshooting

### Still Getting Permission Errors?

1. **Check Authentication**: Make sure you're logged in
2. **Verify Rules Published**: In Firebase Console, check the Rules tab shows your new rules
3. **Check Browser Console**: Look for specific error messages
4. **Wait a Moment**: Rules can take a few seconds to propagate

### Rules Not Saving?

- Make sure you clicked "Publish" after editing
- Check for syntax errors in the rules (Firebase Console will highlight them)
- Make sure you're in the correct Firebase project

## Next Steps

Once rules are set up, you should be able to:
- ✅ Create businesses
- ✅ Create campaigns
- ✅ Create posts
- ✅ View your own data
- ✅ Update and delete your own data

