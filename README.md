# Social Posts - Social Media Management Dashboard

A comprehensive social media management tool for managing businesses, campaigns, and automated social media posts with AI-powered content generation.

## Features

- 🔐 **Authentication**: Secure Firebase Authentication
- 🏢 **Business Management**: Create and manage multiple businesses
- 📊 **Campaign Management**: Organize posts into campaigns
- ✍️ **AI Content Generation**: Generate social media posts with AI
- 📅 **Post Scheduling**: Schedule posts for future publication
- 🎨 **Multi-Platform Support**: Facebook, Instagram, Twitter, LinkedIn (ready for integration)
- 📱 **Responsive Dashboard**: Beautiful, modern UI

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase account and project

### Local Development Setup

**Important:** Do NOT use `sudo` with npm. If you previously used `sudo npm install`, you need to fix permissions first.

#### Quick Start (Recommended)

Run the installation script:

```bash
./install.sh
```

#### Manual Setup

1. **Fix npm cache permissions** (if you used `sudo` before):
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

4. **Create environment file** (see below)

3. **Set up environment variables:**

Create a `.env.local` file in the root directory (see step 4 below for content).

4. **Run the development server:**

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Installation

2. Set up Firebase:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase configuration

3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   │   ├── businesses/    # Business management
│   │   ├── campaigns/     # Campaign management
│   │   ├── posts/         # Post management
│   │   ├── schedule/      # Post scheduling
│   │   └── settings/      # Settings
│   └── page.tsx           # Landing/login page
├── components/            # React components
│   ├── auth/             # Authentication components
│   └── layout/           # Layout components
├── lib/                   # Utility libraries
│   ├── firebase/         # Firebase configuration and functions
│   ├── ai/               # AI content generation
│   └── hooks/            # Custom React hooks
└── public/               # Static assets
```

## Firebase Setup

### Firestore Collections

The app uses the following collections:

- `businesses`: Store business information
- `campaigns`: Store campaign data
- `posts`: Store social media posts

### Security Rules

Make sure to set up proper Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /businesses/{businessId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /campaigns/{campaignId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /posts/{postId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Features Overview

### Business Management
- Create multiple businesses
- Add business details, website, and social media accounts
- AI learns tone of voice from business data (coming soon)

### Campaign Management
- Create campaigns for specific businesses
- Organize posts by campaign
- Track campaign status (draft, active, paused, completed)

### Post Creation
- Create posts manually or with AI assistance
- Schedule posts for future publication
- Support for multiple platforms
- Media attachments (coming soon)

### AI Content Generation
- Generate posts based on business tone
- Platform-specific content optimization
- Learn from existing business content (coming soon)

## Future Enhancements

- [ ] Social media platform integrations (Facebook API, Instagram API, etc.)
- [ ] Automated post publishing
- [ ] AI tone learning from websites and social accounts
- [ ] Media upload and management
- [ ] Analytics and reporting
- [ ] Google/Facebook ad creation
- [ ] Team collaboration features
- [ ] Advanced scheduling options

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **State Management**: React Hooks
- **Icons**: Lucide React

## License

MIT

