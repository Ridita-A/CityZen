// supabaseClient.js
// This file initializes the Supabase client for your app

import { createClient } from "@supabase/supabase-js";

// Replace with your Supabase project URL and anon/public key
const supabaseUrl = SUPAURL;
const supabaseKey = SUPAKEY;

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
