-- Migration: Enable Public Access for Digital Menu
-- Allows unauthenticated users to read specific profile info and active products

-- 1. Profiles: Allow Public Read (for Business Name/Phone)
-- Existing policy: "Users can view own profile" (auth.uid() = id)
-- New policy: "Public can view profiles"
CREATE POLICY "Public can view profiles" ON public.profiles
    FOR SELECT USING (true); 
    -- 'true' allows anyone to select any profile. 
    -- This is acceptable as profiles only contain business info (name, phone). 
    -- Sensitive info should not be in this table if it exists.

-- 2. Products: Allow Public Read for Active Products
-- Existing policy: "Users can manage own products"
-- New policy: "Public can view active products"
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (active = true);

-- 3. Add 'logo_url' and 'banner_url' to profiles for customization (Optional but good)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT '#ea580c'; -- Default Orange

-- 4. Enable RLS is already on, so these new policies just ADD permissions (OR logic).
