const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_KEY; 
const activeKey = serviceRoleKey || anonKey;

if (!supabaseUrl) {
  console.error('[Supabase] SUPABASE_URL missing. Set it in .env');
}

if (!activeKey) {
  console.error('[Supabase] No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_KEY (anon).');
  throw new Error('Supabase key missing: cannot initialize client');
}

if (!serviceRoleKey && anonKey) {
  console.warn('[Supabase] Using anon key. Ensure storage bucket policies allow uploads; otherwise set SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, activeKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = supabase;
