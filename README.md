# Dork Editorial Dashboard

A comprehensive editorial workflow web app for Dan Harrison (AI Deputy Editor) and Stephen Ackroyd (Editor) at Dork Magazine.

## Features

- **Feed Inbox**: Display and manage RSS feed items with approval/reject workflow
- **Draft Queue**: Create, edit, and publish drafts to WordPress
- **WordPress Integration**: Sync and manage WordPress posts
- **Barry Import Tracking**: Track articles that need importing to Barry
- **Notifications**: Telegram webhook notifications for workflow events

## Tech Stack

- React + TypeScript + Tailwind CSS
- Vite build tool
- Supabase for database
- Netlify hosting
- WordPress REST API
- Cloudinary for images
- Telegram Bot API

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WORDPRESS_URL=https://readdork.com
VITE_WORDPRESS_USER=your_wp_username
VITE_WORDPRESS_APP_PASSWORD=your_wp_app_password
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_TELEGRAM_BOT_TOKEN=your_bot_token
VITE_TELEGRAM_CHAT_ID=your_chat_id
```

## Database Schema

### feed_items
- id (uuid, primary key)
- title (text)
- url (text)
- source (text)
- summary (text, optional)
- image_url (text, optional)
- published_at (timestamp)
- status (enum: pending, approved, rejected)
- priority (boolean)
- artist_name (text, optional)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (enum: dan, stephen)

### drafts
- id (uuid, primary key)
- title (text)
- slug (text)
- excerpt (text)
- content (text)
- featured_image (text, optional)
- status (enum: draft, in_review, approved, published)
- wordpress_post_id (integer, optional)
- wordpress_status (enum: draft, publish)
- barry_imported (boolean)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (enum: dan, stephen)
- published_at (timestamp, optional)

### wordpress_articles
- id (uuid, primary key)
- wp_post_id (integer)
- title (text)
- url (text)
- excerpt (text)
- featured_image (text, optional)
- published_at (timestamp)
- barry_imported (boolean)
- barry_imported_at (timestamp, optional)
- created_at (timestamp)
