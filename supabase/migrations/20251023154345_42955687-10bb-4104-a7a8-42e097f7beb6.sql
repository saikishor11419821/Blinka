-- Update RLS policies for stories to show only to followers
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;

-- Stories are viewable by the owner and their followers
CREATE POLICY "Stories are viewable by owner and followers"
ON public.stories
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.follows
    WHERE follows.following_id = stories.user_id
    AND follows.follower_id = auth.uid()
  )
);

-- Allow users to update their own stories (for editing)
CREATE POLICY "Users can update their own stories"
ON public.stories
FOR UPDATE
USING (auth.uid() = user_id);

-- Add music_url column to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_url text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS caption text;

-- Create storage bucket for story media
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for stories bucket
CREATE POLICY "Users can upload their own stories"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Stories are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Users can delete their own stories"
ON storage.objects
FOR DELETE
USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);