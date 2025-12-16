-- Add slug to profiles for friendly URLs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug text UNIQUE;
CREATE INDEX IF NOT EXISTS profiles_slug_idx ON profiles (slug);

-- Add active status to products (default true to keep existing products visible)
ALTER TABLE products ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Add google_event_id to orders to prevent duplicate sync
ALTER TABLE orders ADD COLUMN IF NOT EXISTS google_event_id text;

-- Add comment to explain columns
COMMENT ON COLUMN profiles.slug IS 'URL friendly identifier for public menu';
COMMENT ON COLUMN products.active IS 'Soft delete flag for products (false = hidden from menu)';
COMMENT ON COLUMN orders.google_event_id IS 'ID of the Google Calendar event to prevent duplication';
