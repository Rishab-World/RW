import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hthnzwddxnzutezxzkha.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aG56d2RkeG56dXRlenh6a2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTU2NDgsImV4cCI6MjA2NTE5MTY0OH0.utlxkwM0qwSZM8k0Pt1tn4lltW1qbN53P54UMWhuYUo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 