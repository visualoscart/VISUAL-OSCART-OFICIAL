
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntacijueynpuqwphfjxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YWNpanVleW5wdXF3cGhmanh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Nzk2NzIsImV4cCI6MjA4MjM1NTY3Mn0.GNulAYcSrGe0EAkHKoIatwMZtRS1yu8qcdpHYivDm1k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
