-- Trigger type regeneration by adding a comment
COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON TABLE public.posts IS 'User posts and content';
COMMENT ON TABLE public.stories IS 'Temporary stories (blinks)';
COMMENT ON TABLE public.likes IS 'Post likes';
COMMENT ON TABLE public.comments IS 'Post comments';
COMMENT ON TABLE public.follows IS 'User follow relationships';
COMMENT ON TABLE public.messages IS 'Direct messages between users';