-- Migration: Operations Logs and Timestamps
-- Adds delivered_at to orders and creates a logs table for tracking status changes

-- 1. Add delivered_at to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 2. Create Order Status Logs Table
CREATE TABLE IF NOT EXISTS public.order_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;

-- Policies for logs
CREATE POLICY "Users can view logs for their orders" ON public.order_status_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert logs for their orders" ON public.order_status_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
