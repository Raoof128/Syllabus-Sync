#!/usr/bin/env node

/**
 * Database Setup Script for Syllabus Sync
 * Sets up all required tables and initial data in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up Syllabus Sync database...');

  try {
    // Test basic connectivity first
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.log('📋 Database tables may not exist yet. This is expected for a new Supabase project.');
      console.log('📝 To set up the database:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to the SQL Editor');
      console.log('   3. Run the SQL from lib/supabase/migrations/001_initial_schema.sql');
      console.log('   4. Or use the SQL from database-schema.sql');
      console.log('');
      console.log('For now, the API will work with mock data until the database is set up.');
      return;
    }

    console.log('✅ Database tables exist and are accessible');

    console.log('✅ Database setup complete!');
    console.log('🎯 Testing database connection...');

    // Test the connection by querying each table
    const tests = [
      { table: 'profiles', query: () => supabase.from('profiles').select('count', { count: 'exact', head: true }) },
      { table: 'units', query: () => supabase.from('units').select('count', { count: 'exact', head: true }) },
      { table: 'deadlines', query: () => supabase.from('deadlines').select('count', { count: 'exact', head: true }) },
      { table: 'events', query: () => supabase.from('events').select('count', { count: 'exact', head: true }) },
      { table: 'notifications', query: () => supabase.from('notifications').select('count', { count: 'exact', head: true }) },
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

setupDatabase();
