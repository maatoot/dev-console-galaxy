
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ylzfehbakihjqghbxdta.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemZlaGJha2loanFnaGJ4ZHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDYxNzEsImV4cCI6MjA1OTI4MjE3MX0.y5_SrX6NOxG4MHWAEUq-RXTtRvCBGvmcAM44_TD1VjY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'apihub_auth_token',
    }
  }
);
