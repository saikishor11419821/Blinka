-- Refresh Supabase types by adding a comment to trigger regeneration
COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON TABLE public.posts IS 'User posts and content';
COMMENT ON TABLE public.stories IS 'User stories (blinks) with 24h expiration';
COMMENT ON TABLE public.messages IS 'Direct messages between users';
COMMENT ON TABLE public.notifications IS 'User notifications';
COMMENT ON TABLE public.likes IS 'Post likes tracking';
COMMENT ON TABLE public.comments IS 'Post comments';
COMMENT ON TABLE public.follows IS 'User follow relationships';
COMMENT ON TABLE public.follow_requests IS 'Pending follow requests for private accounts';
COMMENT ON TABLE public.blink_views IS 'Story view tracking';