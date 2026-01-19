import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectUnitStructure() {
  console.log('--- Inspecting Unit Table Structure ---');

  // Try to select all columns from units
  const { data: units, error } = await supabase.from('units').select('*').limit(1);

  if (error) {
    console.error('Error fetching units:', error);
    return;
  }

  if (units && units.length > 0) {
    const unit = units[0];
    console.log('Sample unit columns:', Object.keys(unit));
    console.log('Sample unit data:', unit);

    // Check specific columns of interest
    console.log('\nChecking location storage:');
    if ('location' in unit) {
      console.log('Has "location" column:', unit.location);
      console.log('Type of location:', typeof unit.location);
    } else {
      console.log('No "location" column found.');
    }

    if ('building' in unit) {
      console.log('Has "building" column:', unit.building);
    } else {
      console.log('No "building" column found.');
    }

    if ('room' in unit) {
      console.log('Has "room" column:', unit.room);
    } else {
      console.log('No "room" column found.');
    }
  } else {
    console.log('Units table is empty. Cannot determine structure from data.');

    // Try to insert a row to probe the schema
    // We'll try to insert with building/room columns first (legacy/assumed)
    console.log('\nProbing schema with dummy insert...');

    // Get a user ID to link to
    const {
      data: { users },
    } = await supabase.auth.admin.listUsers();
    if (!users || users.length === 0) {
      console.error('No users found to link test unit to.');
      return;
    }
    const userId = users[0].id;
    console.log('Using user ID:', userId);

    const testUnitLegacy = {
      user_id: userId,
      code: 'PROBE' + Math.floor(Math.random() * 1000),
      name: 'Probe Unit',
      color: '#000000',
      building: 'Probe Building',
      room: '101',
    };

    const { data: legacyData, error: legacyError } = await supabase
      .from('units')
      .insert(testUnitLegacy)
      .select();

    if (legacyError) {
      console.log('Insert with building/room columns failed:', legacyError.message);

      // Try with location JSONB
      const testUnitJson = {
        user_id: userId,
        code: 'PROBE' + Math.floor(Math.random() * 1000),
        name: 'Probe Unit',
        color: '#000000',
        location: { building: 'Probe Building', room: '101' },
      };

      const { data: jsonData, error: jsonError } = await supabase
        .from('units')
        .insert(testUnitJson)
        .select();

      if (jsonError) {
        console.log('Insert with location JSON column failed:', jsonError.message);
      } else {
        console.log('Insert with location JSON column SUCCESS. Schema uses "location" JSONB.');
        // Cleanup
        await supabase.from('units').delete().eq('id', jsonData[0].id);
      }
    } else {
      console.log(
        'Insert with building/room columns SUCCESS. Schema uses "building" and "room" columns.',
      );
      // Cleanup
      await supabase.from('units').delete().eq('id', legacyData[0].id);
    }
  }
}

inspectUnitStructure();
