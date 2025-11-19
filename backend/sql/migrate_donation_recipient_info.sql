-- Migration script to add recipient information to donation_requests table
DO $$ 
BEGIN
  -- Add recipient_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donation_requests' AND column_name = 'recipient_name'
  ) THEN
    ALTER TABLE donation_requests ADD COLUMN recipient_name TEXT;
  END IF;

  -- Add recipient_contact column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donation_requests' AND column_name = 'recipient_contact'
  ) THEN
    ALTER TABLE donation_requests ADD COLUMN recipient_contact TEXT;
  END IF;
END $$;

COMMENT ON COLUMN donation_requests.recipient_name IS 'Name of the person who will receive the donation';
COMMENT ON COLUMN donation_requests.recipient_contact IS 'Contact information of the recipient (phone, email, etc.)';

