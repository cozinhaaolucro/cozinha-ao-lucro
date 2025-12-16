-- Migration: Enable Public Access for Digital Menu

-- 1. Profiles: Allow Public Read (for Business Name/Phone)
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles
    FOR SELECT USING (true); 

-- 2. Products: Allow Public Read for Active Products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (active = true);

-- Enable RLS (already enabled but good to ensure)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
