-- Supabase Migration: 20261028000000_aerion_schema.sql
-- Aerion Aerospace Science & Engineering Encyclopedia

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create encyclopedia_entries table
CREATE TABLE IF NOT EXISTS public.encyclopedia_entries (
  id TEXT PRIMARY KEY DEFAULT ('aerion-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  entry_number VARCHAR(16) NOT NULL UNIQUE,
  component_name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  catalog_id VARCHAR(128) NOT NULL UNIQUE,
  
  -- Structured encyclopedic knowledge sections
  definition_description TEXT DEFAULT '',
  purpose_engineering_value TEXT DEFAULT '',
  operating_principle TEXT DEFAULT '',
  location_installation_context TEXT DEFAULT '',
  applications_operating_context TEXT DEFAULT '',
  interfaces_system_connections TEXT DEFAULT '',
  identification_verification_guidance TEXT DEFAULT '',
  safety_limitations TEXT DEFAULT '',
  technical_reference_guidance TEXT DEFAULT '',

  -- Media & Visuals
  image_storage_path TEXT,
  image_url TEXT,
  image_title VARCHAR(255),
  image_caption TEXT,
  image_alt_text VARCHAR(255),
  image_source VARCHAR(255) DEFAULT 'Aerospace Technical Archive',
  image_source_url TEXT,
  image_verification_status VARCHAR(64) DEFAULT 'Verified',
  image_verified_at DATE,

  -- Administrative & Lifecycle
  status VARCHAR(32) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  review_date DATE,
  featured BOOLEAN NOT NULL DEFAULT false,
  
  -- Extended technical metadata
  facts JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  reference_links JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  stage_location TEXT,
  typical_materials TEXT,

  -- Auditing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_encyclopedia_catalog_id ON public.encyclopedia_entries(catalog_id);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_entry_number ON public.encyclopedia_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_category ON public.encyclopedia_entries(category);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_status ON public.encyclopedia_entries(status);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_featured ON public.encyclopedia_entries(featured);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_created_at ON public.encyclopedia_entries(created_at DESC);

-- 4. Timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_encyclopedia_entries_updated_at ON public.encyclopedia_entries;
CREATE TRIGGER set_encyclopedia_entries_updated_at
  BEFORE UPDATE ON public.encyclopedia_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS)
ALTER TABLE public.encyclopedia_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public users can view published encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Public users can view published encyclopedia entries"
  ON public.encyclopedia_entries FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated users can read all encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Authenticated users can read all encyclopedia entries"
  ON public.encyclopedia_entries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Authenticated users can insert encyclopedia entries"
  ON public.encyclopedia_entries FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Authenticated users can update encyclopedia entries"
  ON public.encyclopedia_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete encyclopedia entries" ON public.encyclopedia_entries;
CREATE POLICY "Authenticated users can delete encyclopedia entries"
  ON public.encyclopedia_entries FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon operations if enabled" ON public.encyclopedia_entries;
CREATE POLICY "Allow anon operations if enabled"
  ON public.encyclopedia_entries FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. Storage bucket: aerospace-media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aerospace-media',
  'aerospace-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

DROP POLICY IF EXISTS "Public Access to aerospace-media" ON storage.objects;
CREATE POLICY "Public Access to aerospace-media"
  ON storage.objects FOR SELECT USING (bucket_id = 'aerospace-media');

DROP POLICY IF EXISTS "Allow uploads to aerospace-media" ON storage.objects;
CREATE POLICY "Allow uploads to aerospace-media"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'aerospace-media');

DROP POLICY IF EXISTS "Allow updates to aerospace-media" ON storage.objects;
CREATE POLICY "Allow updates to aerospace-media"
  ON storage.objects FOR UPDATE USING (bucket_id = 'aerospace-media');

DROP POLICY IF EXISTS "Allow deletions in aerospace-media" ON storage.objects;
CREATE POLICY "Allow deletions in aerospace-media"
  ON storage.objects FOR DELETE USING (bucket_id = 'aerospace-media');
