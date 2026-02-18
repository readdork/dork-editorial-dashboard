# Dork Editorial Dashboard - Deployment Guide

## Quick Start

### 1. Supabase Setup

1. Go to https://supabase.com and create a new project
2. Run the SQL in `supabase/schema.sql` in the SQL Editor
3. Get your Project URL and Anon Key from Settings > API

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# WordPress (for publishing)
VITE_WORDPRESS_URL=https://readdork.com
VITE_WORDPRESS_USER=your-username
VITE_WORDPRESS_APP_PASSWORD=your-app-password

# Cloudinary (for images)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset

# Telegram (for notifications)
VITE_TELEGRAM_BOT_TOKEN=your-bot-token
VITE_TELEGRAM_CHAT_ID=your-chat-id
```

### 3. Deploy to Netlify

Option A: Drag & Drop
1. Go to https://app.netlify.com/drop
2. Drag the `dist/` folder

Option B: Git Integration
1. Push to GitHub
2. Connect repo in Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

## Features

### Feed Inbox
- Add RSS items manually
- Stephen approves/rejects items
- Priority artist highlighting

### Draft Queue
- Dan writes drafts
- Cloudinary image upload
- Stephen edits inline
- One-click publish to WordPress

### WordPress Integration
- View drafts and published posts
- Auto-sync to Barry tracking

### Barry Import Tracking
- List articles not yet in Barry
- One-click import

### Notifications
- Telegram alerts for workflow events
- "Request Attention" button

## User Roles

- **Dan Harrison (AI Deputy Editor)**: Can add feed items, create drafts, submit for review
- **Stephen Ackroyd (Editor)**: Can approve/reject items, edit drafts, publish to WordPress

## Development

```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
```
