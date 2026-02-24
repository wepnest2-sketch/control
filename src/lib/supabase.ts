import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdikhwuovponxkkjvfhl.supabase.co';
// WARNING: This is a SERVICE ROLE key. It bypasses Row Level Security.
// In a production environment, this should only be used on the server-side.
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kaWtod3VvdnBvbnhra2p2ZmhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgxNzQ1MiwiZXhwIjoyMDg3MzkzNDUyfQ.HskkqiYpL3Wlf_0kdm64RdCD_rZJQNaZQBT3dz7lt8Y';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
