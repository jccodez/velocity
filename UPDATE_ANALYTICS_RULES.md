# Update Firestore Rules for Analytics

The analytics feature requires updated Firestore security rules to allow reading analytics data. You need to deploy the updated rules.

## Steps to Deploy Rules

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab

3. **Copy the Rules**
   - Open the `firestore.rules` file in this project
   - Copy the entire contents

4. **Paste and Publish**
   - Paste the rules into the Firebase Console rules editor
   - Click "Publish" to deploy the rules

## What Changed

The rules now include permissions for the `post_analytics` collection:
- Users can read analytics for posts belonging to businesses they own
- Users can create/update analytics for their businesses
- Proper query support for filtering analytics by businessId

## Verification

After deploying the rules, refresh your analytics page. You should be able to:
- View analytics for published posts
- See metrics like likes, comments, shares, impressions, etc.
- Filter analytics by business

## Troubleshooting

If you still get permission errors:
1. Make sure you're logged in
2. Verify the rules were published successfully (check for any syntax errors)
3. Ensure the business you're viewing analytics for belongs to your user account
4. Check the browser console for specific error messages

