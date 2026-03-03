import { createClient } from '@supabase/supabase-js';

// Hardcoded for immediate deployment as requested by user
const supabaseUrl = 'https://mdikhwuovponxkkjvfhl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kaWtod3VvdnBvbnhra2p2ZmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTc0NTIsImV4cCI6MjA4NzM5MzQ1Mn0.iRp1E4k4DVXdhts6lOYK9DXFCZ1PQlvvnF7U_v2U3KQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
