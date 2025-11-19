-- Migration script to simplify donation flow
-- Add recipient_id to donation_history for direct donation receiving

-- Add recipient_id column to donation_history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donation_history' AND column_name = 'recipient_id'
  ) THEN
    ALTER TABLE donation_history ADD COLUMN recipient_id UUID REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_donation_history_recipient_id ON donation_history(recipient_id);
  END IF;
END $$;

-- Update existing donation_history records (if any) to set recipient_id from recipient_name if possible
-- This is optional and can be skipped if no existing data

COMMENT ON COLUMN donation_history.recipient_id IS 'User who received the donation (for direct donation flow)';

