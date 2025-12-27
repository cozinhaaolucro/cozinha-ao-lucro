-- Migration 002: Competitor Features Support
-- Description: Adds support for product highlights (showcase) and Facebook Pixel tracking.

-- 1. Add is_highlight to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.products.is_highlight IS 'Se verdadeiro, produto aparece em destaque/vitrine no cardápio digital';

-- 2. Add facebook_pixel_id to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT;

COMMENT ON COLUMN public.profiles.facebook_pixel_id IS 'ID do Pixel do Facebook para rastreamento no cardápio público';

-- 3. Update RLS policies if necessary (usually not needed for new columns if table policy covers ALL, but good to check)
-- Existing policies cover ALL for owner and SELECT for public on products, so we are good.
