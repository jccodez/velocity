# Facebook API - Quick Visual Setup Guide

## 🎯 What You Actually Need

**Goal**: Get these 3 things:
1. **App ID**
2. **App Secret**
3. **OAuth Redirect URI configured**

## Step-by-Step (Current Meta Interface)

### 1. Create App
- Go to: https://developers.facebook.com/
- Look for **"My Apps"** dropdown or **"Create App"** button
- Click it
- Choose **"Business"** or **"Other"**
- Enter app name and email
- Create

### 2. Find App ID & Secret
- Look in left sidebar: **"Settings"** → **"Basic"**
- You'll see:
  - **App ID**: Copy this
  - **App Secret**: Click "Show" → Copy this
- ✅ Save these! Add to `.env.local`:
  ```env
  FACEBOOK_APP_ID=your_app_id_here
  FACEBOOK_APP_SECRET=your_app_secret_here
  ```

### 3. Add Website Platform
- In **"Settings"** → **"Basic"**
- Scroll to **"Platforms"** section
- Click **"Add Platform"** → **"Website"**
- Enter: `http://localhost:3000`

### 4. Add Facebook Login Product
**Option A:**
- Left sidebar: **"Products"** → **"Add Products"**
- Find **"Facebook Login"** → Click **"Set Up"**
- Choose **"Web"**

**Option B:**
- Left sidebar: **"Products"** → **"Facebook Login"**
- Click **"Settings"**

### 5. Configure OAuth Redirect
- In **"Facebook Login"** → **"Settings"**
- Find **"Valid OAuth Redirect URIs"** or **"Redirect URIs"**
- Click **"Add URI"** or **"Add"**
- Enter: `http://localhost:3000/api/facebook/callback`
- Save

### 6. Add Permissions (If Needed)
**Location 1:**
- **"Products"** → **"Facebook Login"** → **"Permissions and Features"**

**Location 2:**
- **"App Review"** → **"Permissions and Features"**

**Add these:**
- `pages_read_engagement`
- `pages_read_user_content`
- `pages_show_list`

## ✅ Done!

Now you have:
- ✅ App ID
- ✅ App Secret
- ✅ OAuth configured

## 🔍 Can't Find Something?

**Common Alternative Locations:**

**App ID/Secret:**
- Dashboard → Settings → Basic
- Top of dashboard
- "About" section

**OAuth Settings:**
- Products → Facebook Login → Settings
- Settings → Advanced → OAuth
- Products → Facebook Login → Configuration

**Permissions:**
- App Review → Permissions and Features
- Products → Facebook Login → Permissions
- Settings → Advanced → Permissions

## 🆘 Still Stuck?

1. **Check App Type**: Make sure you selected "Business" or "Other"
2. **Check App Mode**: Should be in "Development" mode (this is fine for testing)
3. **Look for "Add Products"**: Some features are under "Products" in sidebar
4. **Try Search**: Use Ctrl+F or Cmd+F to search page for "redirect", "OAuth", "secret"

## 📸 What to Look For

**App ID**: Usually a long number like `1234567890123456`  
**App Secret**: Usually looks like `abcd1234efgh5678ijkl9012mnop3456`  
**Redirect URI Field**: May be called "Valid OAuth Redirect URIs", "Redirect URIs", or "Callback URLs"

