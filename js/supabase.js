
 // ============================================================
 // RetailMind AI - Supabase Client
 // ============================================================

const { createClient } = window.supabase;

// ------------------------------------------------------------
// Supabase Project Configuration
// ------------------------------------------------------------

const SUPABASE_URL = 'https://bqqhiqlmesltrlaafklh.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_3BUAd7CWScWCBFAmg-syHQ_d58hJq0U';

// ------------------------------------------------------------
// Create and expose the Supabase Client
// ------------------------------------------------------------

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Make the same client available to all application scripts.
window.supabaseClient = supabaseClient;

// Optional compatibility aliases for existing modules.
window.db = supabaseClient;

// ------------------------------------------------------------
// Supabase Connection Test
// ------------------------------------------------------------

console.log('RetailMind Supabase client initialized:', !!window.supabaseClient);

supabaseClient.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection error:', error.message);
      return;
    }

    console.log('Supabase connection successful.');
    console.log('Authenticated:', !!data.session);
    console.log('User ID:', data.session?.user?.id ?? 'No active session');
  });
