#!/usr/bin/env node

/**
 * Database Schema Inspection Script
 * Inspects the actual database schema to see what columns exist
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('🔍 Inspecting Database Schema...\n');

  try {
    // Try to get one row from each table to see the actual columns
    const tables = ['deadlines', 'units', 'class_times', 'events', 'notifications', 'profiles'];

    for (const table of tables) {
      console.log(`📋 Inspecting table: ${table}`);
      try {
        // Try to get a sample row
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log(`   ✅ Columns: ${Object.keys(data[0]).join(', ')}`);
          console.log(`   📊 Sample data:`, JSON.stringify(data[0], null, 2));
        } else {
          console.log(`   ℹ️  Table exists but is empty`);
          // Try to insert and immediately delete to see what columns are accepted
          try {
            const testInsert = { id: 'test-id-123' };
            const { error: insertError } = await supabase.from(table).insert(testInsert);

            if (insertError) {
              console.log(`   🔍 Insert test error: ${insertError.message}`);
              // Try without ID
              const { error: insertError2 } = await supabase.from(table).insert({});

              if (insertError2) {
                console.log(`   🔍 Empty insert error: ${insertError2.message}`);
              }
            } else {
              console.log(`   ✅ Can insert with id field`);
              // Clean up
              await supabase.from(table).delete().eq('id', 'test-id-123');
            }
          } catch (e) {
            console.log(`   ⚠️  Could not test insertion`);
          }
        }
      } catch (err) {
        console.log(`   ❌ Table access failed: ${err.message}`);
      }
      console.log('');
    }

    console.log('🎯 Schema inspection complete!');
  } catch (error) {
    console.error('❌ Schema inspection failed:', error);
    process.exit(1);
  }
}

inspectSchema();
