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

-- ==========================================
-- Phase 2: User Profiles & Auth
-- ==========================================

-- Create profiles table linked to Supabase Auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add author_id to existing lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_author FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- RLS Policies
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;

-- Drop old MVP policies to prevent conflicts
DROP POLICY IF EXISTS "Allow public read access on lessons" ON lessons;
DROP POLICY IF EXISTS "Allow public insert on lessons" ON lessons;
DROP POLICY IF EXISTS "Allow public read access on sentences" ON sentences;
DROP POLICY IF EXISTS "Allow public insert on sentences" ON sentences;
DROP POLICY IF EXISTS "Allow authenticated insert on lessons" ON lessons;
DROP POLICY IF EXISTS "Allow users to update own lessons" ON lessons;
DROP POLICY IF EXISTS "Allow authenticated insert on sentences" ON sentences;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Profiles: Users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Lessons: Public read, Authenticated insert
CREATE POLICY "Allow public read access on lessons" 
ON lessons FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow authenticated insert on lessons" 
ON lessons FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Allow users to update own lessons" 
ON lessons FOR UPDATE 
TO authenticated 
USING (auth.uid() = author_id);

-- Sentences: Public read, Authenticated insert
CREATE POLICY "Allow public read access on sentences" 
ON sentences FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow authenticated insert on sentences" 
ON sentences FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lessons 
    WHERE lessons.id = sentences.lesson_id 
    AND lessons.author_id = auth.uid()
  )
);

-- ==========================================
-- Storage Setup
-- ==========================================

-- 5. Create an 'audio' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old MVP storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- Allow public to read audio files
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'audio');

-- Allow authenticated users to upload audio files
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'audio');

-- ==========================================
-- Phase 2.5: YouTube Integration
-- ==========================================

-- Add source_type column to track lesson origin ('upload' or 'youtube')
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'upload';

-- Add youtube_url column to store the YouTube video URL
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Drop NOT NULL constraint on audio_path since YouTube lessons don't have audio files
ALTER TABLE lessons ALTER COLUMN audio_path DROP NOT NULL;
