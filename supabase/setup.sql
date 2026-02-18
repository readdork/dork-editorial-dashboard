-- Create tables for Dork Editorial Dashboard with unique names
-- Run this in Supabase SQL Editor: https://olptdzrcevxexfpcyugt.supabase.co/project/sql

-- Drop existing tables if they exist (from previous attempts)
DROP TABLE IF EXISTS dork_drafts CASCADE;
DROP TABLE IF EXISTS dork_stories CASCADE;

-- Create stories table (feed items)
CREATE TABLE dork_stories (
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
CREATE TABLE dork_drafts (
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

-- Enable RLS
ALTER TABLE dork_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dork_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development)
CREATE POLICY "Allow all on stories" ON dork_stories FOR ALL USING (true);
CREATE POLICY "Allow all on drafts" ON dork_drafts FOR ALL USING (true);

-- Insert test data
INSERT INTO dork_stories (title, url, source, status, created_by, priority) VALUES
('Wet Leg announce new UK tour dates', 'https://nme.com/news/music/wet-leg-uk-tour-2026', 'NME', 'pending', 'dan', true),
('The 1975 tease new album on Instagram', 'https://stereogum.com/1975-new-album-tease', 'Stereogum', 'pending', 'dan', false),
('Foo Fighters add extra London show', 'https://rollingstone.co.uk/foo-fighters-london', 'Rolling Stone UK', 'approved', 'stephen', false);
