const { createClient } = require('@supabase/supabase-js');
const env = require('./env'); // Import the env configuration

const SUPABASE_URL = env.supabaseUrl;
const SUPABASE_SERVICE_KEY = env.supabaseServiceKey; // Use service_role key for backend operations

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Supabase URL or Service Key is not defined in environment variables.');
  process.exit(1); // Exit if critical env vars are missing
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false, // No session persistence on the backend
  },
});

module.exports = supabase;
