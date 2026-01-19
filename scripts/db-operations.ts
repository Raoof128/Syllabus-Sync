/**
 * Database Operations Script
 *
 * This script performs database inspection, creates profiles, and generates sample data.
 * Run with: node scripts/db-operations.js
 * Or: node --experimental-strip-types scripts/db-operations.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials. Check .env.local');
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('🔍 Starting Database Operations...\n');

  // ============================================================================
  // 1. INSPECT CURRENT DATABASE STATE
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
    console.table(profiles);
    console.log(`Total profiles: ${profiles?.length || 0}\n`);
  }

  // Get all auth users using admin API
  console.log('👤 Auth Users (from auth.users):');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError.message);
  } else {
    const usersSummary = authUsers?.users?.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      email_confirmed_at: u.email_confirmed_at,
    }));
    console.table(usersSummary);
    console.log(`Total auth users: ${authUsers?.users?.length || 0}\n`);
  }

  // Get all units
  console.log('📚 Current Units:');
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('*');

  if (unitsError) {
    console.error('Error fetching units:', unitsError.message);
  } else {
    console.table(units?.map(u => ({ id: u.id?.slice(0, 8) + '...', user_id: u.user_id?.slice(0, 8) + '...', code: u.code, name: u.name })));
    console.log(`Total units: ${units?.length || 0}\n`);
  }

  // Get all events
  console.log('📅 Current Events:');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*');

  if (eventsError) {
    console.error('Error fetching events:', eventsError.message);
  } else {
    console.table(events?.map(e => ({
      id: e.id?.slice(0, 8) + '...',
      user_id: e.user_id ? e.user_id.slice(0, 8) + '...' : 'PUBLIC',
      title: e.title?.slice(0, 30),
      start_at: e.start_at,
      category: e.category
    })));
    console.log(`Total events: ${events?.length || 0}\n`);
  }

  // Get all deadlines
  console.log('⏰ Current Deadlines:');
  const { data: deadlines, error: deadlinesError } = await supabase
    .from('deadlines')
    .select('*');

  if (deadlinesError) {
    console.error('Error fetching deadlines:', deadlinesError.message);
  } else {
    console.table(deadlines?.map(d => ({
      id: d.id?.slice(0, 8) + '...',
      user_id: d.user_id?.slice(0, 8) + '...',
      title: d.title?.slice(0, 25),
      unit_code: d.unit_code,
      due_date: d.due_date,
      type: d.type
    })));
    console.log(`Total deadlines: ${deadlines?.length || 0}\n`);
  }

  // Get gamification profiles
  console.log('🎮 Gamification Profiles:');
  const { data: gamProfiles, error: gamError } = await supabase
    .from('gamification_profiles')
    .select('*');

  if (gamError) {
    console.error('Error fetching gamification profiles:', gamError.message);
  } else {
    console.table(gamProfiles?.map(g => ({
      id: g.id?.slice(0, 8) + '...',
      user_id: g.user_id?.slice(0, 8) + '...',
      xp: g.xp,
      streak_days: g.streak_days
    })));
    console.log(`Total gamification profiles: ${gamProfiles?.length || 0}\n`);
  }

  // ============================================================================
  // 2. CREATE NEW PROFILE (if not exists)
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SECTION 2: CREATE NEW PROFILE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const newUserEmail = 'pouya@mq.edu.au';
  const newUserFullName = 'Pouya Developer';
  const newUserStudentId = '15555';

  // Check if auth user exists
  let userId: string | null = null;
  const existingUser = authUsers?.users?.find(u => u.email === newUserEmail);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`✅ Auth user already exists with ID: ${userId}`);
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
      console.log(`✅ Created auth user with ID: ${userId}`);
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
      console.table([existingProfile]);
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
        console.table([newProfile]);
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
  // 3. DISPLAY ALL EVENTS
  // ============================================================================
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SECTION 3: ALL EVENTS FROM DATABASE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const { data: allEvents, error: allEventsError } = await supabase
    .from('events')
    .select('*')
    .order('start_at', { ascending: true });

  if (allEventsError) {
    console.error('Error fetching all events:', allEventsError.message);
  } else if (!allEvents || allEvents.length === 0) {
    console.log('📭 No events found in database.');
  } else {
    console.log(`📅 Found ${allEvents.length} events:\n`);
    allEvents.forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`  ID: ${event.id}`);
      console.log(`  Title: ${event.title}`);
      console.log(`  Description: ${event.description?.slice(0, 100)}...`);
      console.log(`  Start: ${event.start_at}`);
      console.log(`  End: ${event.end_at || 'N/A'}`);
      console.log(`  All Day: ${event.all_day}`);
      console.log(`  Location: ${event.location}`);
      console.log(`  Building: ${event.building || 'N/A'}`);
      console.log(`  Category: ${event.category}`);
      console.log(`  User ID: ${event.user_id || 'PUBLIC (shared)'}`);
      console.log('---');
    });
  }

  console.log('\n✅ Database operations completed!');
}

main().catch(console.error);
