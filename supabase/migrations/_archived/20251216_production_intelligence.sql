
-- Add preparation time to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT 0;

-- Add production timestamps to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS production_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS production_completed_at TIMESTAMPTZ;

-- Add indexes for performance on the panel
CREATE INDEX IF NOT EXISTS idx_orders_production_started ON orders(production_started_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
