
import { createClient } from '@supabase/supabase-js';

// 1. Try to get from Environment Variables (Vite standard)
// We cast import.meta to access env safely even if vite/client types are missing
const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};

// Hardcoded URL per request, with fallback to env var if present (useful for dev)
const finalUrl = env.VITE_SUPABASE_URL || 'https://dgnjpvrzxmmargbkypgh.supabase.co';
const envKey = env.VITE_SUPABASE_ANON_KEY;

// 2. Fallback to LocalStorage (For Key Only)
// This allows you to input keys via UI without hardcoding them in the repo.
const localKey = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_ANON_KEY') : '';

// 3. Determine Final Key
// CHANGED: Revert to prioritize envKey over localKey as requested.
// Standard logic: Env Var > Local Storage > Placeholder
const finalKey = envKey || localKey || 'placeholder';

// Export a flag to check if we have valid-looking credentials
// We assume URL is always configured via hardcoded value
export const isSupabaseConfigured = !!(finalKey && finalKey !== 'placeholder');

export const supabase = createClient(finalUrl, finalKey);
