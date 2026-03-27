
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihjfrxdrhkqfnjofvua.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaGpmcnhkcmhrcWZuam9mdnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzE2NzgsImV4cCI6MjA4MTU0NzY3OH0.sWFK9qz4U6zQixbSsz2wevre-Uk_xcr4Z_KAxAfIVto';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const now = new Date().toISOString();
    console.log('Current ISO time:', now);
    
    // Test 1: Full raw query for count
    const { count, data, error } = await supabase
        .from('it_asset_loans')
        .select('*', { count: 'exact' })
        .neq('status', 'Returned')
        .lt('expected_return_date', now);
        
    if (error) {
        console.error('Error fetching count:', error);
    } else {
        console.log('Found Count:', count);
        console.log('Sample Data (First 2):', data?.slice(0, 2));
    }
    
    // Test 2: List unique statuses
    const { data: statuses } = await supabase.from('it_asset_loans').select('status');
    const unique = [...new Set(statuses?.map(s => s.status))];
    console.log('Unique statuses in DB:', unique);
}

test();
