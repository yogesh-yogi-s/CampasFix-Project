const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { getEnv } = require('./env');

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_KEY');

// For admin operations (seeding), use service role key if available
// For normal app operations, use anon key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  realtime: {
    transport: ws
  }
});

// Create a separate admin client with service role key if available
const supabaseAdmin = getEnv('SUPABASE_SERVICE_ROLE_KEY') 
  ? createClient(supabaseUrl, getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: {
        persistSession: false
      },
      realtime: {
        transport: ws
      }
    })
  : supabase; // fallback to regular client if no service role key

module.exports = supabase;
module.exports.admin = supabaseAdmin;
