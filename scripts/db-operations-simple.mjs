/**
 * Database Operations Script
 *
 * Run with: node scripts/db-operations-simple.mjs
 *
 * This script:
 * 1. Inspects the current database state
 * 2. Creates/updates the profile for pouya@mq.edu.au
 * 3. Lists all events from the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials. Check .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🔍 Starting Database Operations...\n');

// ============================================================================
// SECTION 1: DATABASE INSPECTION
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('SECTION 1: DATABASE INSPECTION');
console.log('═══════════════════════════════════════════════════════════════\n');

// Get all profiles
console.log('📋 Current Profiles:');
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('*');

if (profilesError) {
  console.error('Error fetching profiles:', profilesError.message);
} else {
  if (profiles?.length > 0) {
    console.table(profiles.map(p => ({
      id: p.id?.slice(0, 8) + '...',
      email: p.email,
      full_name: p.full_name,
      student_id: p.student_id
    })));
  } else {
    console.log('No profiles found.');
  }
  console.log(`Total profiles: ${profiles?.length || 0}\n`);
}

// Get all auth users using admin API
console.log('👤 Auth Users:');
const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.error('Error fetching auth users:', authError.message);
} else {
  if (authUsers?.users?.length > 0) {
    console.table(authUsers.users.map(u => ({
      id: u.id?.slice(0, 8) + '...',
      email: u.email,
      created_at: u.created_at?.slice(0, 10),
    })));
  }
  console.log(`Total auth users: ${authUsers?.users?.length || 0}\n`);
}

// Get all units
console.log('📚 Current Units:');
const { data: units, error: unitsError } = await supabase
  .from('units')
  .select('*')
  .is('deleted_at', null);

if (unitsError) {
  console.error('Error fetching units:', unitsError.message);
} else {
  if (units?.length > 0) {
    console.table(units.map(u => ({
      id: u.id?.slice(0, 8) + '...',
      user_id: u.user_id?.slice(0, 8) + '...',
      code: u.code,
      name: u.name
    })));
  } else {
    console.log('No units found.');
  }
  console.log(`Total units: ${units?.length || 0}\n`);
}

// ============================================================================
// SECTION 2: CREATE NEW PROFILE
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('SECTION 2: CREATE/UPDATE PROFILE');
console.log('═══════════════════════════════════════════════════════════════\n');

const newUserEmail = 'pouya@mq.edu.au';
const newUserFullName = 'Pouya Developer';
const newUserStudentId = '15555';

// Check if auth user exists
let userId = null;
const existingUser = authUsers?.users?.find(u => u.email === newUserEmail);

if (existingUser) {
  userId = existingUser.id;
  console.log(`✅ Auth user already exists with ID: ${userId.slice(0, 8)}...`);
} else {
  // Create auth user first
  console.log(`📝 Creating auth user for ${newUserEmail}...`);
  const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
    email: newUserEmail,
    email_confirm: true,
    password: 'TempPassword123!', // Temporary password
    user_metadata: {
      full_name: newUserFullName,
      student_id: newUserStudentId
    }
  });

  if (createAuthError) {
    console.error('Error creating auth user:', createAuthError.message);
  } else {
    userId = newAuthUser.user?.id || null;
    console.log(`✅ Created auth user with ID: ${userId?.slice(0, 8)}...`);
  }
}

if (userId) {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    console.log(`✅ Profile already exists for ${newUserEmail}`);

    // Update the profile with the correct info
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: newUserFullName,
        student_id: newUserStudentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError.message);
    } else {
      console.log('✅ Updated profile:');
      console.table([{
        id: updatedProfile.id.slice(0, 8) + '...',
        email: updatedProfile.email,
        full_name: updatedProfile.full_name,
        student_id: updatedProfile.student_id
      }]);
    }
  } else {
    // Create profile
    console.log(`📝 Creating profile for ${newUserEmail}...`);
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: newUserEmail,
        full_name: newUserFullName,
        student_id: newUserStudentId,
        course: 'Computer Science',
        year: '2026'
      })
      .select()
      .single();

    if (createProfileError) {
      console.error('Error creating profile:', createProfileError.message);
    } else {
      console.log(`✅ Created profile successfully!`);
      console.table([{
        id: newProfile.id.slice(0, 8) + '...',
        email: newProfile.email,
        full_name: newProfile.full_name,
        student_id: newProfile.student_id
      }]);
    }
  }

  // Check if gamification profile exists
  const { data: existingGamProfile } = await supabase
    .from('gamification_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existingGamProfile) {
    console.log(`📝 Creating gamification profile...`);
    const { error: gamCreateError } = await supabase
      .from('gamification_profiles')
      .insert({
        user_id: userId,
        xp: 0,
        streak_days: 0,
        longest_streak: 0
      });

    if (gamCreateError) {
      console.error('Error creating gamification profile:', gamCreateError.message);
    } else {
      console.log(`✅ Created gamification profile successfully!`);
    }
  }
}

// ============================================================================
// SECTION 3: ALL EVENTS
// ============================================================================
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('SECTION 3: ALL EVENTS FROM DATABASE');
console.log('═══════════════════════════════════════════════════════════════\n');

const { data: allEvents, error: allEventsError } = await supabase
  .from('events')
  .select('*')
  .is('deleted_at', null)
  .order('start_at', { ascending: true });

if (allEventsError) {
  console.error('Error fetching all events:', allEventsError.message);
} else if (!allEvents || allEvents.length === 0) {
  console.log('📭 No events found in database.');
} else {
  console.log(`📅 Found ${allEvents.length} events:\n`);

  for (let i = 0; i < allEvents.length; i++) {
    const event = allEvents[i];
    console.log(`Event ${i + 1}:`);
    console.log(`  ID: ${event.id}`);
    console.log(`  Title: ${event.title}`);
    console.log(`  Description: ${event.description?.slice(0, 80)}...`);
    console.log(`  Start: ${event.start_at}`);
    console.log(`  End: ${event.end_at || 'N/A'}`);
    console.log(`  All Day: ${event.all_day}`);
    console.log(`  Location: ${event.location}`);
    console.log(`  Building: ${event.building || 'N/A'}`);
    console.log(`  Category: ${event.category}`);
    console.log(`  User ID: ${event.user_id || 'PUBLIC (shared)'}`);
    console.log('---');
  }
}

// ============================================================================
// SECTION 4: DEADLINES
// ============================================================================
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('SECTION 4: ALL DEADLINES FROM DATABASE');
console.log('═══════════════════════════════════════════════════════════════\n');

const { data: allDeadlines, error: deadlinesError } = await supabase
  .from('deadlines')
  .select('*')
  .is('deleted_at', null)
  .order('due_date', { ascending: true });

if (deadlinesError) {
  console.error('Error fetching deadlines:', deadlinesError.message);
} else if (!allDeadlines || allDeadlines.length === 0) {
  console.log('📭 No deadlines found in database.');
} else {
  console.log(`⏰ Found ${allDeadlines.length} deadlines:\n`);
  console.table(allDeadlines.map(d => ({
    title: d.title?.slice(0, 25),
    unit_code: d.unit_code,
    due_date: d.due_date?.slice(0, 10),
    type: d.type,
    priority: d.priority,
    completed: d.completed ? '✅' : '❌'
  })));
}

console.log('\n✅ Database operations completed!');
console.log('\nTo view the full report, see: docs/DATABASE_OPERATIONS_REPORT.md');
