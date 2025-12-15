-- Add new columns for Public Menu customization
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS color_theme text DEFAULT 'orange';
