-- Migration script to add missing columns to chats table
-- Run this if your chats table doesn't have these columns yet

-- Add status column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'status'
  ) THEN
    ALTER TABLE chats ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add owner_accepted column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'owner_accepted'
  ) THEN
    ALTER TABLE chats ADD COLUMN owner_accepted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add requester_accepted column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'requester_accepted'
  ) THEN
    ALTER TABLE chats ADD COLUMN requester_accepted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add qr_code column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'qr_code'
  ) THEN
    ALTER TABLE chats ADD COLUMN qr_code TEXT;
  END IF;
END $$;

-- Add qr_confirmed column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'qr_confirmed'
  ) THEN
    ALTER TABLE chats ADD COLUMN qr_confirmed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add qr_confirmed_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'qr_confirmed_at'
  ) THEN
    ALTER TABLE chats ADD COLUMN qr_confirmed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add closed_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE chats ADD COLUMN closed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add updated_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE chats ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);
CREATE INDEX IF NOT EXISTS idx_chats_owner_accepted ON chats(owner_accepted);
CREATE INDEX IF NOT EXISTS idx_chats_requester_accepted ON chats(requester_accepted);
CREATE INDEX IF NOT EXISTS idx_chats_qr_confirmed ON chats(qr_confirmed);

