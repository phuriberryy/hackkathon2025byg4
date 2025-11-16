-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  faculty TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  item_condition TEXT NOT NULL,
  looking_for TEXT,
  pickup_location TEXT,
  description TEXT,
  available_until DATE,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exchange requests table
CREATE TABLE IF NOT EXISTS exchange_requests (
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

-- Exchange history table (เก็บประวัติการแลกเปลี่ยนที่สำเร็จ)
CREATE TABLE IF NOT EXISTS exchange_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange_request_id UUID REFERENCES exchange_requests(id) ON DELETE SET NULL,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  co2_reduced DECIMAL(10, 2) DEFAULT 0.00,
  exchanged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  exchange_request_id UUID REFERENCES exchange_requests(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  owner_accepted BOOLEAN DEFAULT FALSE,
  requester_accepted BOOLEAN DEFAULT FALSE,
  qr_code TEXT,
  qr_confirmed BOOLEAN DEFAULT FALSE,
  qr_confirmed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_different_participants CHECK (creator_id != participant_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
-- Items indexes
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- Exchange requests indexes
CREATE INDEX IF NOT EXISTS idx_exchange_requests_item_id ON exchange_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_requester_id ON exchange_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_status ON exchange_requests(status);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_owner_accepted ON exchange_requests(owner_accepted);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_requester_accepted ON exchange_requests(requester_accepted);

-- Exchange history indexes
CREATE INDEX IF NOT EXISTS idx_exchange_history_owner_id ON exchange_history(owner_id);
CREATE INDEX IF NOT EXISTS idx_exchange_history_requester_id ON exchange_history(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchange_history_item_id ON exchange_history(item_id);
CREATE INDEX IF NOT EXISTS idx_exchange_history_exchanged_at ON exchange_history(exchanged_at DESC);

-- Chats indexes
CREATE INDEX IF NOT EXISTS idx_chats_creator_id ON chats(creator_id);
CREATE INDEX IF NOT EXISTS idx_chats_participant_id ON chats(participant_id);
CREATE INDEX IF NOT EXISTS idx_chats_item_id ON chats(item_id);
CREATE INDEX IF NOT EXISTS idx_chats_exchange_request_id ON chats(exchange_request_id);
CREATE INDEX IF NOT EXISTS idx_chats_creator_participant ON chats(creator_id, participant_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add constraint to prevent users from chatting with themselves
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_different_participants' 
    AND conrelid = 'chats'::regclass
  ) THEN
    ALTER TABLE chats ADD CONSTRAINT check_different_participants 
      CHECK (creator_id != participant_id);
  END IF;
END $$;
