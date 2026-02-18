# Netlify Deployment Instructions

## Manual Deploy (Fastest)

1. **Build the project:**
   ```bash
   cd /root/.openclaw/workspace/dork-dashboard
   npm run build
   ```

2. **Go to Netlify Drop:**
   - Visit: https://app.netlify.com/drop
   - Drag and drop the `dist/` folder
   - Site will be live instantly

3. **Configure Environment Variables:**
   - Go to Site settings > Environment variables
   - Add all variables from `.env.example`

## Git-based Deploy (Recommended for updates)

1. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/dork-editorial-dashboard.git
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" > "Import an existing project"
   - Connect GitHub and select the repo
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anon/public key |
| VITE_WORDPRESS_URL | WordPress site URL |
| VITE_WORDPRESS_USER | WordPress username |
| VITE_WORDPRESS_APP_PASSWORD | WordPress app password |
| VITE_CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| VITE_CLOUDINARY_UPLOAD_PRESET | Cloudinary upload preset |
| VITE_TELEGRAM_BOT_TOKEN | Telegram bot token |
| VITE_TELEGRAM_CHAT_ID | Telegram chat ID |

## Post-Deploy Checklist

- [ ] Supabase tables created
- [ ] All environment variables set
- [ ] WordPress app password generated
- [ ] Cloudinary upload preset configured
- [ ] Telegram bot created and added to chat
