
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// I need service role to bypass RLS for diagnosis, or simulate user.
// But I only have anon key in .env.local usually.
// Server actions use createServerSupabaseClient. 
// I'll try with ANON key. If RLS blocks, I might see 0 rows.
// But I can try to sign in as the user if I knew credentials.
// Or I can check if SERVICE_ROLE_KEY is in .env.local.

const sb = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Checking Chat Tables...');

    // list tables? NO, can't list tables with client.
    // Try to select from chat_conversations
    const { data: convs, error: convError } = await sb
        .from('chat_conversations')
        .select('*')
        .limit(5);

    if (convError) console.error('Error fetching chat_conversations:', convError);
    else console.log(`Found ${convs?.length} conversations. Sample:`, convs?.[0]);

    // Try to select from chat_messages
    const { data: msgs, error: msgError } = await sb
        .from('chat_messages')
        .select('*')
        .limit(5);

    if (msgError) console.error('Error fetching chat_messages:', msgError);
    else console.log(`Found ${msgs?.length} messages. Sample:`, msgs?.[0]);
}

main();
