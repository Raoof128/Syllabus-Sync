import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function inspectSchema() {
  console.log('\n🔬 INSPECTING ACTUAL TABLE COLUMNS\n');

  // Get one row from each table to see actual column names
  const tables = [
    'units',
    'deadlines',
    'events',
    'class_times',
    'notifications',
    'user_preferences',
    'profiles',
  ];

  for (const table of tables) {
    console.log(`\n📋 ${table.toUpperCase()}:`);
    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
      console.log(`   Error: ${error.message}`);
      // Try to get columns even if empty
      const { data: emptyData, error: emptyError } = await supabase.from(table).select().limit(0);
      if (emptyError) {
        console.log(`   Cannot access table: ${emptyError.message}`);
      }
    } else if (data && data[0]) {
      const cols = Object.keys(data[0]);
      console.log(`   Columns: ${cols.join(', ')}`);
      console.log(`   Sample: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
    } else {
      console.log('   (empty table - cannot determine columns from data)');
    }
  }
}

inspectSchema().catch(console.error);
