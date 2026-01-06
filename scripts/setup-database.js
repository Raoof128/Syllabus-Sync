#!/usr/bin/env node

/**
 * Database Setup Script for Syllabus Sync
 * Sets up all required tables and initial data in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error(
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Check if migration flag is provided
const shouldMigrate = process.argv.includes('--migrate') || process.argv.includes('-m');

async function setupDatabase() {
  console.log('🚀 Setting up Syllabus Sync database...');

  if (shouldMigrate) {
    console.log('📝 Running database migration...');
    await runMigration();
    return;
  }

  try {
    // Test basic connectivity first
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.log(
        '📋 Database tables may not exist yet. This is expected for a new Supabase project.',
      );
      console.log('📝 To set up the database:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to the SQL Editor');
      console.log('   3. Run the SQL from lib/supabase/migrations/001_initial_schema.sql');
      console.log('   4. Or use the SQL from database-schema.sql');
      console.log('');
      console.log('💡 Or run this script with --migrate flag:');
      console.log('   node scripts/setup-database.js --migrate');
      console.log('');
      console.log('For now, the API will work with mock data until the database is set up.');
      return;
    }

    console.log('✅ Database tables exist and are accessible');

    console.log('✅ Database setup complete!');
    console.log('🎯 Testing database connection...');

    // Test the connection by querying each table
    const tests = [
      {
        table: 'profiles',
        query: () => supabase.from('profiles').select('count', { count: 'exact', head: true }),
      },
      {
        table: 'units',
        query: () => supabase.from('units').select('count', { count: 'exact', head: true }),
      },
      {
        table: 'deadlines',
        query: () => supabase.from('deadlines').select('count', { count: 'exact', head: true }),
      },
      {
        table: 'events',
        query: () => supabase.from('events').select('count', { count: 'exact', head: true }),
      },
      {
        table: 'notifications',
        query: () => supabase.from('notifications').select('count', { count: 'exact', head: true }),
      },
    ];

    for (const test of tests) {
      try {
        const { error } = await test.query();
        if (error) {
          console.error(`❌ ${test.table} table test failed:`, error.message);
        } else {
          console.log(`✅ ${test.table} table accessible`);
        }
      } catch (err) {
        console.error(`❌ ${test.table} table test failed:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function runMigration() {
  try {
    if (!supabaseAdmin) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required for migrations');
      console.error('Add it to your .env.local file');
      process.exit(1);
    }

    // Read the migration file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const migrationPath = join(
      __dirname,
      '..',
      'lib',
      'supabase',
      'migrations',
      '001_initial_schema.sql',
    );

    console.log('📖 Reading migration file...');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('⚡ Executing migration...');

    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Running statement ${i + 1}/${statements.length}...`);
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          console.error('SQL:', statement.substring(0, 100) + '...');
          process.exit(1);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('🎯 Verifying database setup...');

    // Test the setup
    await setupDatabase();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

setupDatabase();
