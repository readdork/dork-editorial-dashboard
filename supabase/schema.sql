-- Create feed_items table for Dork Editorial Dashboard
CREATE TABLE IF NOT EXISTS feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  summary TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  priority BOOLEAN DEFAULT false,
  artist_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL CHECK (created_by IN ('dan', 'stephen'))
);

-- Create drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'published')),
  wordpress_post_id INTEGER,
  wordpress_status TEXT CHECK (wordpress_status IN ('draft', 'publish')),
  barry_imported BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL CHECK (created_by IN ('dan', 'stephen')),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create wordpress_articles table
CREATE TABLE IF NOT EXISTS wordpress_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_post_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  featured_image TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  barry_imported BOOLEAN DEFAULT false,
  barry_imported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_articles ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for now)
CREATE POLICY "Allow all" ON feed_items FOR ALL USING (true);
CREATE POLICY "Allow all" ON drafts FOR ALL USING (true);
CREATE POLICY "Allow all" ON wordpress_articles FOR ALL USING (true);
