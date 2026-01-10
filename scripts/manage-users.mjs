#!/usr/bin/env node
/**
 * User Management Script
 *
 * Deletes all users and creates a new dev account.
 * Run with: node scripts/manage-users.mjs
 *
 * SECURITY: Password is read from DEV_USER_PASSWORD env var or generated randomly
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure .env.local is configured properly.');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteUserDependencies(userId) {
  console.log(`   🧹 Cleaning dependencies for user ${userId}...`);

  // List of tables that may have user_id foreign keys
  const tables = [
    'profiles',
    'gamification_profiles',
    'units',
    'deadlines',
    'events',
    'notifications',
    'user_settings',
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);

      if (error && !error.message.includes('does not exist')) {
        console.log(`      ⚠️  ${table}: ${error.message}`);
      }
    } catch (e) {
      // Table might not exist, ignore
    }
  }

  // Also try with 'id' for profiles table
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error && !error.message.includes('does not exist')) {
      console.log(`      ⚠️  profiles (by id): ${error.message}`);
    }
  } catch (e) {
    // Ignore
  }
}

async function deleteAllUsers() {
  console.log('🗑️  Fetching all users...');

  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return false;
  }

  if (!users || users.users.length === 0) {
    console.log('ℹ️  No users found.');
    return true;
  }

  console.log(`📋 Found ${users.users.length} user(s). Deleting...`);

  for (const user of users.users) {
    console.log(`   Deleting: ${user.email || user.id}`);

    // First, delete dependencies
    await deleteUserDependencies(user.id);

    // Then delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`   ❌ Failed to delete ${user.email}: ${deleteError.message}`);

      // Try harder - delete with force
      console.log('   🔄 Attempting force delete...');
      // Wait a bit and retry
      await new Promise((r) => setTimeout(r, 1000));

      const { error: retryError } = await supabase.auth.admin.deleteUser(user.id, true);
      if (retryError) {
        console.error(`   ❌ Force delete also failed: ${retryError.message}`);
      } else {
        console.log(`   ✅ Force deleted: ${user.email || user.id}`);
      }
    } else {
      console.log(`   ✅ Deleted: ${user.email || user.id}`);
    }
  }

  return true;
}

async function createDevUser(email, password) {
  console.log(`\n👤 Creating user: ${email}`);

  // First check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  if (existingUser) {
    console.log('ℹ️  User already exists. Updating credentials...');

    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('❌ Error updating user:', error.message);
      return null;
    }

    console.log('✅ User updated successfully!');
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm the email
    user_metadata: {
      full_name: 'Raouf Developer',
    },
  });

  if (error) {
    console.error('❌ Error creating user:', error.message);
    return null;
  }

  console.log('✅ User created successfully!');
  console.log(`   ID: ${data.user.id}`);
  console.log(`   Email: ${data.user.email}`);
  console.log(`   Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);

  return data.user;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('       Syllabus Sync User Management       ');
  console.log('═══════════════════════════════════════════');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log('');

  // Step 1: Delete all existing users
  const deleteSuccess = await deleteAllUsers();
  if (!deleteSuccess) {
    console.error('\n❌ Failed to delete users. Continuing anyway...');
  }

  // Step 2: Create/update the dev user
  // SECURITY: Use environment variable or generate a random password
  const devPassword = process.env.DEV_USER_PASSWORD || randomBytes(16).toString('hex');
  const devEmail = process.env.DEV_USER_EMAIL || 'raouf@mq.edu.au';

  const newUser = await createDevUser(devEmail, devPassword);

  if (!newUser) {
    console.error('\n❌ Failed to create/update user.');
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('                  DONE!                     ');
  console.log('═══════════════════════════════════════════');
  console.log('\n📝 Login credentials:');
  console.log(`   Email:    ${devEmail}`);
  if (process.env.DEV_USER_PASSWORD) {
    // eslint-disable-next-line no-console
    console.log('   Credential: Set via DEV_USER_PASSWORD env var');
  } else {
    // Show first 4 chars of random token for verification, mask the rest
    // eslint-disable-next-line no-console
    console.log(`   Token: ${devPassword.substring(0, 4)}${'*'.repeat(12)} (random - save this!)`);
    console.log(
      '\n⚠️  Random token generated. Set DEV_USER_PASSWORD in .env.local for consistency.',
    );
  }
  console.log('\n✨ You can now login at http://localhost:3000/login');
}

main().catch(console.error);
