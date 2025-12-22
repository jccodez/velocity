# Troubleshooting Guide

## Page Won't Load / Just Spinning

If your page is stuck on a loading spinner, try these fixes:

### 1. Restart the Dev Server

```bash
# Stop the server (Ctrl+C or):
lsof -ti:3000 | xargs kill

# Start it again:
npm run dev
```

### 2. Check Browser Console

Open your browser's developer console (F12) and look for errors. Common issues:
- Firebase configuration errors
- Network errors
- JavaScript errors

### 3. Check Firebase Configuration

Make sure your `.env.local` file exists and has all required values:

```bash
# Check if file exists
test -f .env.local && echo "File exists" || echo "File missing"

# File should contain:
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# etc.
```

### 4. Clear Browser Cache

Sometimes cached JavaScript can cause issues:
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or clear browser cache completely

### 5. Check Server Logs

Look at your terminal where `npm run dev` is running for error messages.

### 6. Reinstall Dependencies

If all else fails:

```bash
rm -rf node_modules package-lock.json .next
npm install --ignore-scripts
npm run dev
```

## Common Errors

### "next: command not found"

Use the direct path:
```bash
./node_modules/.bin/next dev
```

Or fix npm PATH issues (see SETUP.md)

### Firebase Errors

- Check `.env.local` exists and has correct values
- Verify Firebase project is set up correctly
- Check browser console for specific Firebase error messages

### Infinite Loading

The auth hook now has a 5-second timeout. If it still hangs:
- Check browser console for errors
- Verify Firebase Auth is enabled in Firebase Console
- Try logging out and back in

