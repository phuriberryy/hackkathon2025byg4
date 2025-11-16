-- Migration script to add requester item fields to exchange_requests table
-- Run this if your exchange_requests table doesn't have these columns yet

-- Add requester item fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exchange_requests' AND column_name = 'requester_item_name'
  ) THEN
    ALTER TABLE exchange_requests ADD COLUMN requester_item_name TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exchange_requests' AND column_name = 'requester_item_category'
  ) THEN
    ALTER TABLE exchange_requests ADD COLUMN requester_item_category TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exchange_requests' AND column_name = 'requester_item_condition'
  ) THEN
    ALTER TABLE exchange_requests ADD COLUMN requester_item_condition TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exchange_requests' AND column_name = 'requester_item_description'
  ) THEN
    ALTER TABLE exchange_requests ADD COLUMN requester_item_description TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exchange_requests' AND column_name = 'requester_item_image_url'
  ) THEN
    ALTER TABLE exchange_requests ADD COLUMN requester_item_image_url TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exchange_requests' AND column_name = 'requester_pickup_location'
  ) THEN
    ALTER TABLE exchange_requests ADD COLUMN requester_pickup_location TEXT;
  END IF;
END $$;

