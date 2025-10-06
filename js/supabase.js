// js/supabase.js - UPDATED VERSION
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Initialize Supabase client with enhanced configuration
const supabaseUrl = 'https://zfywzczelvbsoptwrrpj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeXd6Y3plbHZic29wdHdycnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTU4NjQsImV4cCI6MjA2NjM3MTg2NH0.g_GdN_TH61N3g6_ExLLF1K-dLvFxW1XTqTQZbSMohBU'

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
    debug: true // Enable debug mode for development
  },
  global: {
    headers: {
      'X-Client-Info': 'salama-admin-dashboard/1.0.0'
    }
  }
})

// Add error logging for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);
  
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.email);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    // Clear any sensitive data from localStorage
    localStorage.removeItem('supabase.auth.token');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
  } else if (event === 'USER_UPDATED') {
    console.log('User updated', session?.user);
  }
});

// Set up bucket policies for profile photos
const setupProfilePhotoPolicies = async () => {
  try {
    // Policy: Allow authenticated users to view their own profile photos
    const { error: viewPolicyError } = await supabase
      .rpc('create_policy', {
        policy_name: 'profile_photo_select_policy',
        table_name: 'profiles',
        using: 'auth.uid() = user_id',
        action: 'SELECT'
      })

    if (viewPolicyError && !viewPolicyError.message.includes('already exists')) {
      console.error('Error creating view policy:', viewPolicyError)
    }

    // Policy: Allow users to update their own profile photos
    const { error: updatePolicyError } = await supabase
      .rpc('create_policy', {
        policy_name: 'profile_photo_update_policy',
        table_name: 'profiles',
        using: 'auth.uid() = user_id',
        action: 'UPDATE'
      })

    if (updatePolicyError && !updatePolicyError.message.includes('already exists')) {
      console.error('Error creating update policy:', updatePolicyError)
    }

    console.log('Profile photo policies ready')
  } catch (err) {
    console.error('Policy setup error:', err)
  }
}

// Initialize storage when in browser context
if (typeof window !== 'undefined') {
  // Comment out or remove bucket creation from frontend
  // initializeProfilePhotosBucket().then(success => {
  //   if (success) {
  //     setupProfilePhotoPolicies()
  //   }
  // })
}
