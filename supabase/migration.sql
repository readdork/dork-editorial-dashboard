-- Create entirely new tables for Dork Editorial Dashboard
-- Run this in Supabase SQL Editor: https://olptdzrcevxexfpcyugt.supabase.co/project/sql

-- Create editorial_stories table (completely separate from feed_items)
CREATE TABLE IF NOT EXISTS editorial_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  summary TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  priority BOOLEAN DEFAULT false,
  artist_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL CHECK (created_by IN ('dan', 'stephen'))
);

-- Create editorial_drafts table
CREATE TABLE IF NOT EXISTS editorial_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES editorial_stories(id),
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

-- Enable Row Level Security
ALTER TABLE editorial_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (development)
CREATE POLICY "Allow all on editorial_stories" ON editorial_stories FOR ALL USING (true);
CREATE POLICY "Allow all on editorial_drafts" ON editorial_drafts FOR ALL USING (true);

-- Insert sample data
INSERT INTO editorial_stories (title, url, source, status, created_by, priority, summary) VALUES
('Wet Leg announce new UK tour dates', 'https://nme.com/news/music/wet-leg-uk-tour-2026', 'NME', 'pending', 'dan', true, 'The band will play 5 dates across the UK in March'),
('The 1975 tease new album on Instagram', 'https://stereogum.com/1975-new-album-tease', 'Stereogum', 'pending', 'dan', false, 'Matty Healy posted cryptic images suggesting new music'),
('Foo Fighters add extra London show', 'https://rollingstone.co.uk/foo-fighters-london', 'Rolling Stone UK', 'approved', 'stephen', false, 'Due to high demand, a third London date has been added');
