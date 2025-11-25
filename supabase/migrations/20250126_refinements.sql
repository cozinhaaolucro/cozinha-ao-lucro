-- Migration: Refinements for Stock Management and Customer Stats
-- Execute this after the initial schema

-- 1. Add stock management to ingredients
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(10, 2) DEFAULT 0;

-- 2. Add selling unit to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS selling_unit TEXT DEFAULT 'unidade';

-- 3. Trigger to auto-update customer stats when order is created
CREATE OR REPLACE FUNCTION update_customer_stats_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if there's a customer associated
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers 
    SET 
      last_order_date = NEW.created_at,
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total_value,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats_on_order();

-- 4. Trigger to update customer stats when order is cancelled/updated
CREATE OR REPLACE FUNCTION update_customer_stats_on_order_change()
RETURNS TRIGGER AS $$
DECLARE
  value_diff NUMERIC;
BEGIN
  -- Only if customer changed or value changed
  IF OLD.customer_id IS NOT NULL THEN
    -- Recalculate stats for old customer
    UPDATE public.customers
    SET
      total_orders = (
        SELECT COUNT(*) FROM orders 
        WHERE customer_id = OLD.customer_id 
        AND status != 'cancelled'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_value), 0) FROM orders 
        WHERE customer_id = OLD.customer_id 
        AND status != 'cancelled'
      ),
      last_order_date = (
        SELECT MAX(created_at) FROM orders 
        WHERE customer_id = OLD.customer_id 
        AND status != 'cancelled'
      ),
      updated_at = NOW()
    WHERE id = OLD.customer_id;
  END IF;
  
  IF NEW.customer_id IS NOT NULL AND NEW.customer_id != OLD.customer_id THEN
    -- Recalculate for new customer
    UPDATE public.customers
    SET
      total_orders = (
        SELECT COUNT(*) FROM orders 
        WHERE customer_id = NEW.customer_id 
        AND status != 'cancelled'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_value), 0) FROM orders 
        WHERE customer_id = NEW.customer_id 
        AND status != 'cancelled'
      ),
      last_order_date = (
        SELECT MAX(created_at) FROM orders 
        WHERE customer_id = NEW.customer_id 
        AND status != 'cancelled'
      ),
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_updated ON public.orders;
CREATE TRIGGER on_order_updated
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats_on_order_change();

-- 5. Fix existing customer stats (run once)
DO $$
DECLARE
  customer_record RECORD;
BEGIN
  FOR customer_record IN SELECT id FROM public.customers
  LOOP
    UPDATE public.customers
    SET
      total_orders = (
        SELECT COUNT(*) FROM orders 
        WHERE customer_id = customer_record.id 
        AND status != 'cancelled'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_value), 0) FROM orders 
        WHERE customer_id = customer_record.id 
        AND status != 'cancelled'
      ),
      last_order_date = (
        SELECT MAX(created_at) FROM orders 
        WHERE customer_id = customer_record.id
      )
    WHERE id = customer_record.id;
  END LOOP;
END $$;

-- 6. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON public.orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

COMMENT ON COLUMN ingredients.stock_quantity IS 'Quantidade em estoque (na mesma unidade do ingrediente)';
COMMENT ON COLUMN products.selling_unit IS 'Unidade de venda: unidade, kg, pacote, dúzia, etc';
