# Vercel Deployment Commands

## Quick Deploy

```bash
# Deploy to production
npx vercel --prod
```

## Full Deployment Process

### Step 1: Login (if not already logged in)
```bash
npx vercel login
```

### Step 2: Deploy (creates project if it doesn't exist)
```bash
npx vercel
```

This will:
- Ask if you want to set up and deploy → Type **Y**
- Ask which scope → Select your account
- Ask to link to existing project → Type **N** (for first time)
- Ask for project name → Type **velocity** or press Enter
- Ask for directory → Type **./** or press Enter
- Ask to override settings → Type **N**

### Step 3: Add Environment Variables

Add each variable one at a time:

```bash
# Firebase variables
npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
npx vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
npx vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

# Facebook variables
npx vercel env add FACEBOOK_APP_ID production
npx vercel env add FACEBOOK_APP_SECRET production

# OpenAI variable
npx vercel env add OPENAI_API_KEY production
```

**Note:** Each command will prompt you to paste the value. You can also add to preview and development environments by running the same commands with `preview` and `development` instead of `production`.

### Step 4: Deploy to Production
```bash
npx vercel --prod
```

## Other Useful Commands

### Check deployment status
```bash
npx vercel ls
```

### View deployment logs
```bash
npx vercel logs [deployment-url]
```

### Open deployment in browser
```bash
npx vercel open
```

### Remove deployment
```bash
npx vercel remove [project-name]
```

### List environment variables
```bash
npx vercel env ls
```

### Pull environment variables to .env.local
```bash
npx vercel env pull .env.local
```

