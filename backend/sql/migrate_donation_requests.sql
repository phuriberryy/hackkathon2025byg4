-- Migration script to add donation requests feature
-- This allows donation items to work like exchange items with request/accept flow

-- Add listing_type to items table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'listing_type'
  ) THEN
    ALTER TABLE items ADD COLUMN listing_type TEXT DEFAULT 'exchange';
    -- Set existing items to 'exchange' if they don't have a type
    UPDATE items SET listing_type = 'exchange' WHERE listing_type IS NULL;
  END IF;
END $$;

-- Create donation_requests table (similar to exchange_requests but for donations)
CREATE TABLE IF NOT EXISTS donation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending',
  owner_accepted BOOLEAN DEFAULT FALSE,
  requester_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for donation_requests
CREATE INDEX IF NOT EXISTS idx_donation_requests_item_id ON donation_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_requester_id ON donation_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_status ON donation_requests(status);
CREATE INDEX IF NOT EXISTS idx_donation_requests_owner_accepted ON donation_requests(owner_accepted);
CREATE INDEX IF NOT EXISTS idx_donation_requests_requester_accepted ON donation_requests(requester_accepted);

-- Add donation_request_id to chats table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'donation_request_id'
  ) THEN
    ALTER TABLE chats ADD COLUMN donation_request_id UUID REFERENCES donation_requests(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_chats_donation_request_id ON chats(donation_request_id);
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE donation_requests IS 'Stores donation requests when users request to receive donated items';
COMMENT ON COLUMN items.listing_type IS 'Type of listing: exchange or donation';

