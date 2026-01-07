-- Add customization fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banner_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color_theme text DEFAULT 'orange'; -- Default to orange
