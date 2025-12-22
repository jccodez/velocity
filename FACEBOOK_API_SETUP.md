# Facebook API Connection - Complete Setup Guide

## 🎯 Overview

This guide will help you set up the Facebook Graph API connection for your Social Posts application.

## Step 1: Create Meta/Facebook App

⚠️ **Note**: Facebook's interface changes frequently. These instructions may vary slightly, but the general flow should be similar.

### Option A: New Interface (2024+)

1. Go to [Meta for Developers](https://developers.facebook.com/) (formerly Facebook Developers)
2. Click **"My Apps"** in the top right, or look for a **"Create App"** button
3. You may see:
   - A button that says **"Create App"**
   - Or **"Add App"**
   - Or a **"+"** icon
4. When prompted for app type, choose:
   - **"Business"** (recommended)
   - Or **"Other"** if Business isn't available
5. Fill in:
   - **App Display Name**: "Social Posts" (or your preferred name)
   - **App Contact Email**: Your email
6. Click **"Create App"** or **"Next"**

### Option B: If You See Use Case Selection

If Facebook asks **"What do you want your app to do?"** or shows use case options:

✅ **Select at minimum:**
- **"Manage and access Pages"** - Required for reading posts

✅ **Also select:**
- **"Content Publishing"** - For posting content

✅ **Optional:**
- **"Analytics"** - For insights
- **"Community Management"** - For comments/messages

### Option C: If No Use Case Selection

Don't worry - you can add products/features later. Continue to Step 2.

## Step 2: Add Facebook Login Product

The interface may vary here. Look for one of these:

**Path A (Most Common):**
1. In your app dashboard, look for:
   - **"Products"** section in the left sidebar
   - Or **"Add Products"** button
   - Or **"Get Started"** cards
2. Find **"Facebook Login"** or **"Meta Login"**
3. Click **"Set Up"** or **"Get Started"**
4. Select **"Web"** as the platform
5. Enter site URL: `http://localhost:3000`

**Path B (If Already Available):**
1. Look in left sidebar for **"Facebook Login"** or **"Products"** → **"Facebook Login"**
2. Click on it to configure

**Path C (Settings Menu):**
1. Go to **"Settings"** → **"Basic"**
2. Look for **"Add Platform"** or **"Platforms"**
3. Add **"Website"** if not already added

## Step 3: Configure OAuth Settings

### Get Your App Credentials

1. In your app dashboard, go to **"Settings"** → **"Basic"** (left sidebar)
2. You'll see:
   - **App ID** (copy this - you'll need it)
   - **App Secret** (click "Show" to reveal - you'll need this too)
3. Save these values - you'll add them to `.env.local` later

### Configure OAuth Redirect URIs

**Path A: Facebook Login Settings**
1. Go to **"Products"** → **"Facebook Login"** → **"Settings"** (left sidebar)
2. Look for **"Valid OAuth Redirect URIs"** or **"Redirect URIs"**
3. Add this URI:
   ```
   http://localhost:3000/api/facebook/callback
   ```
4. Click **"Save Changes"** or **"Add URI"**

**Path B: Settings → Basic**
1. If you don't see Facebook Login Settings, go to **"Settings"** → **"Basic"**
2. Look for **"Add Platform"** → **"Website"**
3. Enter Site URL: `http://localhost:3000`
4. Then find OAuth settings elsewhere (may be under "Advanced" or in Facebook Login product)

**Path C: Advanced Settings**
1. Try **"Settings"** → **"Advanced"**
2. Look for OAuth or Redirect URI settings

### Add App Domains

1. Still in **"Settings"** → **"Basic"**
2. Find **"App Domains"** field
3. Add:
   - `localhost` (for development)
   - Your production domain (when deployed, e.g., `yourdomain.com`)

## Step 4: Configure OAuth Redirect URIs

1. Go to **"Products"** → **"Facebook Login"** → **"Settings"**
2. In **"Valid OAuth Redirect URIs"**, add:
   ```
   http://localhost:3000/api/facebook/callback
   https://yourdomain.com/api/facebook/callback
   ```
3. Click **"Save Changes"**

## Step 5: Request Permissions

This step may be found in different places. Try these locations:

**Path A: Permissions & Features**
1. Go to **"Products"** → **"Facebook Login"** → **"Permissions and Features"**
2. Look for **"Permissions"** or **"Add Permissions"**
3. Add these permissions (you may need to search for them):
   - ✅ `pages_read_engagement`
   - ✅ `pages_read_user_content`
   - ✅ `pages_show_list`
   - ✅ `read_insights` (optional, for analytics)

**Path B: App Review (Advanced)**
1. Some permissions are only available after adding them here
2. Go to **"App Review"** → **"Permissions and Features"**
3. Click **"Add"** or **"Request"** next to each permission

**Path C: Settings**
1. Try **"Settings"** → **"Advanced"** → **"Permissions"**

**Note**: In Development Mode, you may only see basic permissions. Advanced permissions require App Review for production use.

## Step 6: Get App Credentials

In your app dashboard:
1. Go to **"Settings"** → **"Basic"**
2. Copy:
   - **App ID** (you'll use this)
   - **App Secret** (click "Show" to reveal)

## Step 7: Add to Environment Variables

Add to your `.env.local` file:

```env
# Facebook API Configuration
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here

# Optional: For testing, you can add a page access token directly
# FACEBOOK_ACCESS_TOKEN=your_page_access_token_here

# Your app URL (for OAuth callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 8: Update Firestore Security Rules

Make sure your `firestore.rules` includes the Facebook connections collection (already added):

```javascript
match /facebook_connections/{userId} {
  allow read, write: if isAuthenticated() && request.auth.uid == userId;
}
```

## Step 9: Test the Connection

1. **Start your dev server**: `npm run dev`
2. **Go to Settings**: Navigate to `/dashboard/settings`
3. **Click "Connect Facebook"**: You'll be redirected to Facebook
4. **Authorize the app**: Log in and grant permissions
5. **Return to app**: You'll be redirected back with a token
6. **Verify connection**: You should see "Connected" status

## Step 10: Test Tone Analysis

1. Go to a business detail page
2. Make sure the business has a Facebook account in `socialMediaAccounts.facebook`
3. Click **"Analyze from Facebook"**
4. The system will fetch recent posts and analyze tone

## Troubleshooting

### "Invalid OAuth Redirect URI"
- Make sure you added the callback URL in Facebook App settings
- Check that URLs match exactly (including http vs https)

### "App Not Setup"
- Make sure you've added Facebook Login product
- Verify App Domains are configured
- Check that Site URL is set

### "Permissions Error"
- Make sure you requested the correct permissions
- Some permissions require app review for production
- For development, you can test with your own account

### "Access Token Expired"
- Short-lived tokens expire in 1 hour
- The system automatically exchanges for 60-day tokens
- You may need to reconnect periodically

### "Page Access Required"
- Make sure you're a page admin
- Grant page permissions when authorizing

## Production Deployment

When deploying to production:

1. **Add production domains** in Facebook App settings
2. **Update OAuth redirect URIs** with production URL
3. **Submit for App Review** (required for public use)
4. **Update environment variables** with production values

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git
- Keep App Secret secure
- Access tokens are stored in Firestore (encrypted at rest)
- Use HTTPS in production
- Implement token refresh for long-term use

## Next Steps

Once connected, you can:
- ✅ Analyze tone from Facebook posts
- ✅ Schedule posts to Facebook (coming soon)
- ✅ Auto-publish content (coming soon)
- ✅ View analytics (coming soon)

## API Routes Created

- `GET /api/facebook/connect` - Initiates OAuth flow
- `GET /api/facebook/callback` - Handles OAuth callback
- `POST /api/facebook/posts` - Fetches Facebook posts
- `POST /api/facebook/analyze-tone` - Analyzes tone from posts

## Need Help?

- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- [Facebook Login Guide](https://developers.facebook.com/docs/facebook-login/web)
- [OAuth 2.0 Flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)

