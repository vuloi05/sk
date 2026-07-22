-- ==========================================
-- DictaFlow — Supabase Schema Setup
-- ==========================================

-- 1. Create the `lessons` table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  language TEXT NOT NULL, -- 'ja' or 'en'
  level TEXT NOT NULL,    -- 'beginner', 'intermediate', 'advanced'
  description TEXT,
  audio_path TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  sentence_count INTEGER DEFAULT 0,
  tags TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the `sentences` table
CREATE TABLE sentences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,
  gap_fill_data JSONB,
  mcq_data JSONB
);

-- 3. Create indexes for performance
CREATE INDEX idx_lessons_language ON lessons(language);
CREATE INDEX idx_lessons_level ON lessons(level);
CREATE INDEX idx_sentences_lesson_id ON sentences(lesson_id);
CREATE INDEX idx_sentences_order ON sentences(order_index);

-- 4. Enable Row Level Security (RLS)
-- For MVP, we allow anyone to read and insert (community driven).
-- In production, you might want to restrict inserts to authenticated users.

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;

-- Allow public read access to lessons
CREATE POLICY "Allow public read access on lessons" 
ON lessons FOR SELECT 
TO public 
USING (true);

-- Allow public insert access to lessons (MVP only)
CREATE POLICY "Allow public insert on lessons" 
ON lessons FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow public read access to sentences
CREATE POLICY "Allow public read access on sentences" 
ON sentences FOR SELECT 
TO public 
USING (true);

-- Allow public insert access to sentences (MVP only)
CREATE POLICY "Allow public insert on sentences" 
ON sentences FOR INSERT 
TO public 
WITH CHECK (true);

-- ==========================================
-- Storage Setup
-- ==========================================

-- 5. Create an 'audio' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio', 'audio', true);

-- 6. Set up Storage Policies
-- Allow public to read audio files
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'audio');

-- Allow public to upload audio files (MVP only)
CREATE POLICY "Public Upload" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'audio');
