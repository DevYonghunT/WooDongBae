-- Create courses table
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('접수중', '마감임박', '마감')),
  image_url TEXT NOT NULL,
  d_day TEXT NOT NULL,
  institution TEXT,
  price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows read access to everyone
CREATE POLICY "Enable read access for all users" ON courses
    FOR SELECT USING (true);

-- Create a policy that allows insert/update/delete only for authenticated users (optional, adjust as needed)
-- CREATE POLICY "Enable insert for authenticated users only" ON courses
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
