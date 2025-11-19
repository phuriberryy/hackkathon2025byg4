-- Migration script to add donation feature
-- Run this migration to add donation functionality

-- Donation history table (เก็บประวัติการบริจาค)
CREATE TABLE IF NOT EXISTS donation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name TEXT,
  recipient_contact TEXT,
  donation_location TEXT,
  message TEXT,
  co2_reduced DECIMAL(10, 2) DEFAULT 0.00,
  donated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for donation_history
CREATE INDEX IF NOT EXISTS idx_donation_history_donor_id ON donation_history(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_history_item_id ON donation_history(item_id);
CREATE INDEX IF NOT EXISTS idx_donation_history_donated_at ON donation_history(donated_at DESC);

-- Add comment
COMMENT ON TABLE donation_history IS 'Stores donation history when users donate items instead of exchanging them';

