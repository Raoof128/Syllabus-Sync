import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRLSDetail() {
  console.log('\n🔍 DETAILED RLS AND SCHEMA CHECK (using anon key)\n');
  console.log('='.repeat(60));
  
  // Check what units are accessible without auth
  console.log('\n📋 UNITS ACCESSIBLE WITHOUT AUTH:');
  const { data: anonUnits, error: unitsErr } = await supabase
    .from('units')
    .select('id, code, name, user_id, building, room');
  
  if (unitsErr) {
    console.log(`   ✅ RLS blocking: ${unitsErr.message}`);
  } else if (anonUnits && anonUnits.length > 0) {
    console.log(`   ⚠️  ${anonUnits.length} units accessible without auth:`);
    anonUnits.forEach(u => {
      console.log(`      - ${u.code}: ${u.name} | user_id: ${u.user_id || 'NULL'}`);
    });
    console.log('\n   ❌ PROBLEM: Units with NULL user_id bypass RLS policy');
    console.log('   The RLS policy "auth.uid() = user_id" returns FALSE for NULL user_id');
    console.log('   but these records exist from before the migration.\n');
  } else {
    console.log('   ✅ No units accessible - RLS working');
  }
  
  // Check deadlines
  console.log('\n📋 DEADLINES ACCESSIBLE WITHOUT AUTH:');
  const { data: anonDeadlines, error: deadlinesErr } = await supabase
    .from('deadlines')
    .select('id, title, user_id, unit_code');
  
  if (deadlinesErr) {
    console.log(`   ✅ RLS blocking: ${deadlinesErr.message}`);
  } else if (anonDeadlines && anonDeadlines.length > 0) {
    console.log(`   ⚠️  ${anonDeadlines.length} deadlines accessible without auth`);
  } else {
    console.log('   ✅ No deadlines accessible (empty or RLS working)');
  }
  
  // Check events - public should be accessible
  console.log('\n📋 EVENTS ACCESSIBLE WITHOUT AUTH:');
  const { data: anonEvents, error: eventsErr } = await supabase
    .from('events')
    .select('id, title, user_id, category');
  
  if (eventsErr) {
    console.log(`   Error: ${eventsErr.message}`);
  } else if (anonEvents) {
    const publicCount = anonEvents.filter(e => e.user_id === null).length;
    const userCount = anonEvents.filter(e => e.user_id !== null).length;
    console.log(`   Public events (user_id IS NULL): ${publicCount} ✅ (expected)`);
    console.log(`   User-specific events: ${userCount} ${userCount > 0 ? '❌ PROBLEM' : '✅'}`);
  }
  
  // Check notifications
  console.log('\n📋 NOTIFICATIONS ACCESSIBLE WITHOUT AUTH:');
  const { data: anonNotifs, error: notifsErr } = await supabase
    .from('notifications')
    .select('id, title, user_id');
  
  if (notifsErr) {
    console.log(`   ✅ RLS blocking: ${notifsErr.message}`);
  } else if (anonNotifs && anonNotifs.length > 0) {
    console.log(`   ⚠️  ${anonNotifs.length} notifications accessible`);
  } else {
    console.log('   ✅ No notifications accessible (empty or RLS working)');
  }
  
  // Check user_preferences
  console.log('\n📋 USER_PREFERENCES ACCESSIBLE WITHOUT AUTH:');
  const { data: anonPrefs, error: prefsErr } = await supabase
    .from('user_preferences')
    .select('id, user_id, theme');
  
  if (prefsErr) {
    console.log(`   ✅ RLS blocking: ${prefsErr.message}`);
  } else if (anonPrefs && anonPrefs.length > 0) {
    console.log(`   ⚠️  ${anonPrefs.length} preferences accessible`);
  } else {
    console.log('   ✅ No preferences accessible (empty or RLS working)');
  }
  
  // Check class_times (should be accessible via unit relationship)
  console.log('\n📋 CLASS_TIMES ACCESSIBLE WITHOUT AUTH:');
  const { data: anonClassTimes, error: ctErr } = await supabase
    .from('class_times')
    .select('id, unit_id, day');
  
  if (ctErr) {
    console.log(`   Error/RLS: ${ctErr.message}`);
  } else if (anonClassTimes && anonClassTimes.length > 0) {
    console.log(`   ⚠️  ${anonClassTimes.length} class_times accessible`);
    console.log('   Note: class_times may need RLS based on unit ownership');
  } else {
    console.log('   ✅ No class_times accessible');
  }
  
  // Check for custom users table
  console.log('\n📋 CUSTOM USERS TABLE:');
  const { data: customUsers, error: usersErr } = await supabase
    .from('users')
    .select('*')
    .limit(3);
  
  if (usersErr) {
    console.log(`   ${usersErr.message.includes('does not exist') ? '(Table does not exist - using auth.users)' : usersErr.message}`);
  } else if (customUsers) {
    console.log(`   Found ${customUsers.length} users`);
    if (customUsers.length > 0) {
      console.log('   Columns:', Object.keys(customUsers[0]).join(', '));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY:\n');
}

checkRLSDetail().catch(console.error);
