# Local Development Setup Guide

## Quick Start

**⚠️ Important:** If you previously ran `sudo npm install`, you need to fix npm cache permissions first (see step 1 below).

### Option 1: Use the Installation Script (Easiest)

```bash
./install.sh
```

This script will automatically:
- Check Node.js version
- Fix npm cache permissions
- Clean previous installations
- Install dependencies

### Option 2: Manual Installation

1. **Fix npm cache permissions** (if you used `sudo npm install` before):
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

2. **Clean previous installations**:
   ```bash
   rm -rf node_modules package-lock.json .next
   npm cache clean --force
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```
   ⚠️ **Do NOT use `sudo npm install`** - This can cause permission issues.

3. **Create environment file**:
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` with your Firebase credentials.

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Troubleshooting Installation Issues

### If you get "command not found" errors:

1. **Clean everything**:
   ```bash
   rm -rf node_modules package-lock.json .next
   ```

2. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

3. **Reinstall**:
   ```bash
   npm install
   ```

### If you get permission errors:

Instead of using `sudo`, fix npm permissions:

```bash
# Fix npm directory permissions
sudo chown -R $(whoami) ~/.npm

# Or create a directory for global packages
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### If you get "napi-postinstall" errors:

This error is related to the `unrs-resolver` native module, but **it won't prevent the app from running**. The development server works fine without it.

**Quick fix - Install with ignored scripts:**
```bash
npm install --ignore-scripts
```

This installs all dependencies but skips optional native module builds. Next.js will run perfectly fine in development mode.

**Why this happens:**
- The `unrs-resolver` package requires native compilation
- `napi-postinstall` command might not be available in the PATH
- This is an optional dependency and doesn't affect Next.js development

**If you still want to fix it (optional):**
1. Install Xcode Command Line Tools: `xcode-select --install`
2. Or manually install the missing tool (usually not necessary)

### If you get "EACCES" permission errors:

Your npm cache has root-owned files from using `sudo`:

```bash
# Fix npm cache ownership
sudo chown -R $(whoami) ~/.npm

# Then try installing again
npm install
```

## Environment Variables Setup

1. Create `.env.local` file:
   ```bash
   touch .env.local
   ```

2. Add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
   ```

3. Get Firebase config from [Firebase Console](https://console.firebase.google.com/):
   - Go to your project
   - Click the gear icon → Project settings
   - Scroll down to "Your apps"
   - Copy the config values

## Development Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Need Help?

If you're still having issues:

1. Check Node.js version: `node --version` (should be 18+)
2. Check npm version: `npm --version` (should be 9+)
3. Try cleaning and reinstalling (see Troubleshooting above)
4. Check the error logs in `/Users/jamesclark/.npm/_logs/`

