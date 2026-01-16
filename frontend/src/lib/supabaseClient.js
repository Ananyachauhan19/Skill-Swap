import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Provide clear signal in dev console
  console.error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check frontend/.env and restart dev server.');
} else {
  console.log('[Supabase] Initialized with URL:', SUPABASE_URL);
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

export function getPublicUrl(bucket, path) {
  if (!bucket || !path) return null;
  
  // Get public URL from Supabase client
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  let publicUrl = data?.publicUrl || null;
  
  // Ensure URL has https:// protocol
  if (publicUrl && !publicUrl.startsWith('http://') && !publicUrl.startsWith('https://')) {
    publicUrl = `https://${publicUrl}`;
  }
  
  console.log('[Supabase] Generated public URL:', publicUrl);
  return publicUrl;
}
