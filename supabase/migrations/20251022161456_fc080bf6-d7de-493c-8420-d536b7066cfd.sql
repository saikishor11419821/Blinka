-- Add user_id field to profiles table for unique numeric login ID
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE;

-- Create a function to generate a unique 6-digit user ID
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-digit number
    new_user_id := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if this ID already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = new_user_id) INTO id_exists;
    
    -- If it doesn't exist, we can use it
    IF NOT id_exists THEN
      RETURN new_user_id;
    END IF;
  END LOOP;
END;
$$;

-- Update the handle_new_user function to include user_id generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  random_suffix TEXT;
  new_user_id TEXT;
BEGIN
  -- Generate a random 6-character alphanumeric suffix for username
  random_suffix := substring(md5(random()::text) from 1 for 6);
  
  -- Generate unique user_id
  new_user_id := generate_unique_user_id();
  
  INSERT INTO public.profiles (id, user_id, username, email)
  VALUES (
    NEW.id,
    new_user_id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || random_suffix),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create stories table for Blinks feature
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Enable RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policies for stories
CREATE POLICY "Stories are viewable by everyone"
ON public.stories
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own stories"
ON public.stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);

-- Create a function to clean up expired stories
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END;
$$;