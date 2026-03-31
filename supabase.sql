-- Create hosts table
CREATE TABLE hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE,
  object_id TEXT UNIQUE NOT NULL, -- slug
  name TEXT,
  wifi_name TEXT,
  wifi_password TEXT,
  instructions_json JSONB DEFAULT '[]'::jsonb,
  checklist_json JSONB DEFAULT '[]'::jsonb,
  blacklist TEXT[] DEFAULT '{}',
  show_review BOOLEAN DEFAULT true,
  show_services BOOLEAN DEFAULT true,
  show_instructions BOOLEAN DEFAULT true,
  show_sos BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  subscription_until TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checkouts table
CREATE TABLE checkouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
  guest_phone TEXT,
  photos_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;

-- Policies for hosts (Public can read by object_id to show dashboard)
CREATE POLICY "Public read by object_id" ON hosts FOR SELECT USING (true);

-- Policies for checkouts (Public can insert)
CREATE POLICY "Public insert checkouts" ON checkouts FOR INSERT WITH CHECK (true);

-- Policies for hosts (Host can update their own data via telegram_id)
-- Note: In a real app, you'd use Supabase Auth, but since we use Telegram, 
-- we'll rely on the backend for updates or a custom claim if using Supabase Auth.
-- For now, let's keep it simple and assume the backend handles sensitive updates.
