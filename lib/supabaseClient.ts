
import { createClient } from '@supabase/supabase-js';

// Fungsi bantuan untuk mendapatkan env var dengan aman di browser
const getEnv = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    return (window.process?.env?.[key] || process?.env?.[key] || fallback);
  } catch (e) {
    return fallback;
  }
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://yihjfrxdrhkqfnjofvua.supabase.co');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaGpmcnhkcmhrcWZuam9mdnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzE2NzgsImV4cCI6MjA4MTU0NzY3OH0.sWFK9qz4U6zQixbSsz2wevre-Uk_xcr4Z_KAxAfIVto');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
