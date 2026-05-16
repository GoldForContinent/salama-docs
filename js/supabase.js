// js/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { supabaseUrl, supabaseKey } from './supabase-config.js';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  }
})
