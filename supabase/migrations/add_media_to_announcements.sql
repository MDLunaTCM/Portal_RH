-- Migration: Add media support to announcements table
-- This migration is OPTIONAL for MVP
-- Run this when you're ready to persist media data to database

-- Add media columns to announcements table
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
ADD COLUMN IF NOT EXISTS featured_image_alt TEXT,
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]';

-- Add comment if needed
COMMENT ON COLUMN announcements.featured_image_url IS 'URL to featured/hero image for announcement';
COMMENT ON COLUMN announcements.featured_image_alt IS 'Alt text for featured image (accessibility)';
COMMENT ON COLUMN announcements.media IS 'JSON array of media objects: [{id, type, url, alt, thumbnail_url}]';

-- Index for featured image queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_announcements_featured_image 
ON announcements(featured_image_url) 
WHERE featured_image_url IS NOT NULL;

-- Add priority column if not exists (for filtering)
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' 
CHECK (priority IN ('normal', 'important', 'urgent'));

COMMENT ON COLUMN announcements.priority IS 'Priority level: normal, important, or urgent';

-- Index for priority queries
CREATE INDEX IF NOT EXISTS idx_announcements_priority 
ON announcements(priority);

-- Example: Update existing announcements to have empty media array
-- (This is safe to run - just ensures consistency)
UPDATE announcements SET media = '[]' WHERE media IS NULL;
