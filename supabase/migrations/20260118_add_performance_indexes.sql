-- Indexes for Performance Optimization
-- These indexes target the most frequent query patterns: Filtering by User ID + Sorting/Filtering by Date or Name.

-- Orders: Used in Dashboard and Orders List (Filtering by range, sorting)
CREATE INDEX IF NOT EXISTS idx_orders_user_delivery ON orders (user_id, delivery_date);

-- Customers: Used in Customer List (Search, Pagination)
CREATE INDEX IF NOT EXISTS idx_customers_user_name ON customers (user_id, name);

-- Products: Used in Product List (Pagination)
CREATE INDEX IF NOT EXISTS idx_products_user_name ON products (user_id, name);

-- Ingredients: Used in Ingredient List (Pagination)
CREATE INDEX IF NOT EXISTS idx_ingredients_user_name ON ingredients (user_id, name);
