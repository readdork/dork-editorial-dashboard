# Database Schema for Dork Editorial Dashboard

## Tables

### feed_items
```sql
create table feed_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  url text not null,
  source text not null,
  summary text,
  image_url text,
  published_at timestamp with time zone,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  priority boolean default false,
  artist_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by text check (created_by in ('dan', 'stephen'))
);

-- Indexes
create index idx_feed_items_status on feed_items(status);
create index idx_feed_items_priority on feed_items(priority);
create index idx_feed_items_created_at on feed_items(created_at desc);
```

### drafts
```sql
create table drafts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null,
  excerpt text not null,
  content text not null,
  featured_image text,
  status text default 'draft' check (status in ('draft', 'in_review', 'approved', 'published')),
  wordpress_post_id integer,
  wordpress_status text check (wordpress_status in ('draft', 'publish')),
  barry_imported boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by text check (created_by in ('dan', 'stephen')),
  published_at timestamp with time zone
);

-- Indexes
create index idx_drafts_status on drafts(status);
create index idx_drafts_wordpress_post_id on drafts(wordpress_post_id);
create index idx_drafts_created_at on drafts(created_at desc);
```

### wordpress_articles
```sql
create table wordpress_articles (
  id uuid default gen_random_uuid() primary key,
  wp_post_id integer not null unique,
  title text not null,
  url text not null,
  excerpt text,
  featured_image text,
  published_at timestamp with time zone not null,
  barry_imported boolean default false,
  barry_imported_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Indexes
create index idx_wp_articles_barry_imported on wordpress_articles(barry_imported);
create index idx_wp_articles_published_at on wordpress_articles(published_at desc);
```

## Row Level Security (RLS)

Enable RLS on all tables:

```sql
alter table feed_items enable row level security;
alter table drafts enable row level security;
alter table wordpress_articles enable row level security;

-- Allow all operations for authenticated users (simplified for MVP)
create policy "Allow all" on feed_items for all using (true);
create policy "Allow all" on drafts for all using (true);
create policy "Allow all" on wordpress_articles for all using (true);
```
