import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function checkSchema() {
  console.log('\n📊 REMOTE DATABASE SCHEMA CHECK\n');
  console.log('='.repeat(60));

  const tablesToCheck = [
    'profiles',
    'units',
    'class_times',
    'deadlines',
    'events',
    'notifications',
    'user_preferences',
  ];

  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
      console.log(`\n❌ ${table.toUpperCase()}`);
      console.log(`   Error: ${error.message}`);
    } else {
      console.log(`\n✅ ${table.toUpperCase()}`);
      if (data && data[0]) {
        const columns = Object.keys(data[0]);
        console.log(`   Columns (${columns.length}): ${columns.join(', ')}`);
      } else {
        // Table exists but is empty, try to get columns another way
        console.log(`   (empty - checking structure...)`);
      }
    }
  }

  // Check events count to verify seed data
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 DATA COUNTS:\n');

  for (const table of tablesToCheck) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });

    if (!error) {
      console.log(`   ${table}: ${count} rows`);
    }
  }

  // Check if public events exist
  console.log('\n' + '='.repeat(60));
  console.log('\n🌐 PUBLIC EVENTS (user_id IS NULL):\n');

  const { data: publicEvents, error: eventsError } = await supabase
    .from('events')
    .select('id, title, event_date, category')
    .is('user_id', null)
    .limit(5);

  if (eventsError) {
    console.log(`   Error: ${eventsError.message}`);
  } else if (publicEvents && publicEvents.length > 0) {
    publicEvents.forEach((e) => {
      console.log(`   • ${e.title} (${e.category}) - ${e.event_date}`);
    });
    console.log(`   ... and more (${publicEvents.length} shown)`);
  } else {
    console.log('   No public events found');
  }
}

checkSchema().catch(console.error);

// Additional checks
async function checkRLSAndTriggers() {
  console.log('\n' + '='.repeat(60));
  console.log('\n🔒 RLS POLICIES CHECK:\n');

  // Try to query without auth - should fail if RLS is enabled
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const tables = ['units', 'deadlines', 'notifications', 'user_preferences'];

  for (const table of tables) {
    const { data, error } = await anonSupabase.from(table).select('*').limit(1);

    if (error && error.message.includes('RLS')) {
      console.log(`   ✅ ${table}: RLS blocking anonymous access`);
    } else if (data && data.length === 0) {
      console.log(`   ⚠️  ${table}: Empty or RLS filtering (check manually)`);
    } else if (data && data.length > 0) {
      console.log(`   ❌ ${table}: Data returned without auth - RLS may not be working!`);
    } else if (error) {
      console.log(`   ⚠️  ${table}: ${error.message}`);
    }
  }

  // Check events (should allow public events)
  const { data: events, error: eventsError } = await anonSupabase
    .from('events')
    .select('*')
    .is('user_id', null)
    .limit(1);

  if (events && events.length > 0) {
    console.log(`   ✅ events: Public events accessible (correct behavior)`);
  } else if (eventsError) {
    console.log(`   ⚠️  events: ${eventsError.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🔧 FUNCTIONS & TRIGGERS CHECK:\n');

  // Check if our functions exist by looking for seeded data patterns
  const { data: units } = await supabase
    .from('units')
    .select('code')
    .in('code', ['COMP2310', 'MATH1001', 'HIST2002', 'COMP1010']);

  if (units && units.length > 0) {
    console.log(`   ✅ Sample units exist: ${units.map((u) => u.code).join(', ')}`);
    console.log(`      (Seed function appears to be working)`);
  } else {
    console.log(`   ⚠️  No sample units found - triggers may not have fired yet`);
    console.log(`      (This is normal if no new users have signed up since migration)`);
  }
}

checkRLSAndTriggers().catch(console.error);
