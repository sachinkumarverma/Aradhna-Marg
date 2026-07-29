-- 1. Create the new youtube_videos table
CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  youtube_url TEXT,
  published_at TIMESTAMPTZ,
  duration TEXT,
  channel_id TEXT,
  channel_name TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  tags TEXT[],
  playlist TEXT,
  import_status TEXT DEFAULT 'NEW',
  linked_bhajan_id UUID REFERENCES public.bhajans(id) ON DELETE SET NULL,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Setup Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_youtube_videos_modtime ON public.youtube_videos;

CREATE TRIGGER update_youtube_videos_modtime
BEFORE UPDATE ON public.youtube_videos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 3. Add index on status for quick filtering
CREATE INDEX IF NOT EXISTS idx_youtube_videos_status ON public.youtube_videos(import_status);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_published_at ON public.youtube_videos(published_at DESC);

-- 4. CLEANUP: Delete all imported YouTube videos from the bhajans table to ensure clean SEO!
DELETE FROM public.bhajans WHERE youtube_video_id IS NOT NULL;

-- 5. Refresh the PostgREST schema cache so the backend API recognizes the new table
NOTIFY pgrst, 'reload schema';
