-- Add display_id column for human-readable order numbers
ALTER TABLE orders ADD COLUMN display_id SERIAL;

-- Optional: If you want to restart the sequence or backfill existing orders with specific logic, you can do it here.
-- For now, SERIAL naturally backfills existing rows with unique numbers and increments for new ones.
