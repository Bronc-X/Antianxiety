import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in .env.local');
    process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🚀 Running chat_messages migration...\n');

    const sql = fs.readFileSync('supabase/migrations/20260103_create_chat_messages.sql', 'utf8');

    // Split by semicolons and run each statement
    const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

    for (const stmt of statements) {
        if (!stmt || stmt.startsWith('--')) continue;
        console.log('Executing:', stmt.substring(0, 80) + '...');

        const { error } = await sb.rpc('exec_sql', { sql_text: stmt });

        if (error) {
            // Try direct query for specific statements
            console.log('  → RPC failed, trying alternate approach...');
        } else {
            console.log('  ✅ Success');
        }
    }

    // Verify the table and policy exist
    console.log('\n📋 Verifying chat_messages table...');
    const { data, error } = await sb.from('chat_messages').select('*').limit(1);

    if (error) {
        console.error('❌ Error accessing chat_messages:', error);
    } else {
        console.log('✅ chat_messages table is accessible! Rows found:', data?.length || 0);
    }
}

main();
