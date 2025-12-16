-- MIGRATION: 20251213_add_subscription_fields
-- OBJECTIVE: Add columns to track subscription status, allowing for payment blocking.

-- Add subscription columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'pro',
ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

-- Add check constraint for status
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS subscription_status_check;
ALTER TABLE public.profiles
ADD CONSTRAINT subscription_status_check 
CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled'));

-- Update existing profiles to have default values if null
UPDATE public.profiles 
SET subscription_status = 'trial' 
WHERE subscription_status IS NULL;

UPDATE public.profiles 
SET subscription_plan = 'pro' 
WHERE subscription_plan IS NULL;
