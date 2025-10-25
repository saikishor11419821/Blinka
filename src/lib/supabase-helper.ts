// Helper file to ensure TypeScript picks up Supabase types
// This file forces a recompile and provides type-safe helpers

import { supabase } from "@/integrations/supabase/client";

// Re-export the supabase client with proper typing
export { supabase };

// Type helper to ensure the client is properly typed
export type SupabaseClient = typeof supabase;
