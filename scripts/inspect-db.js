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

async function inspect() {
  console.log('--- Inspecting Database with Service Role Key ---');

  // 1. List tables (using a trick or just checking if select works)
  // Actually, standard way is to query pg_catalog if possible, or just try to select from known tables.
  // We'll try to select 1 row from 'units' to see if table exists and columns.

  console.log('\nChecking table: units');
  const { data: units, error: unitsError } = await supabase.from('units').select('*').limit(1);
  if (unitsError) {
    console.error('Error querying units:', unitsError);
  } else {
    console.log('Successfully queried units. Row count:', units.length);
    if (units.length > 0) {
      console.log('Sample row keys:', Object.keys(units[0]));
    } else {
      console.log('Table is empty.');
    }
  }

  console.log('\nChecking table: deadlines');
  const { data: deadlines, error: deadlinesError } = await supabase
    .from('deadlines')
    .select('*')
    .limit(1);
  if (deadlinesError) {
    console.error('Error querying deadlines:', deadlinesError);
  } else {
    console.log('Successfully queried deadlines. Row count:', deadlines.length);
  }

  // 2. Insert a test unit to see if it works (bypassing RLS)
  // This confirms the table structure is what we expect.
  /*
  console.log('\nAttempting to insert test unit...');
  const testUnit = {
    code: 'TEST101',
    name: 'Test Unit',
    color: '#000000',
    location: { building: 'Test', room: '1' },
    schedule: [],
    // user_id: ... wait, do we need user_id?
  };
  // We need a valid user_id if there is a foreign key constraint.
  // We can fetch a user first.
  */

  // 3. List users
  console.log('\nListing users...');
  const {
    data: { users },
    error: usersError,
  } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error listing users:', usersError);
  } else {
    console.log('User count:', users.length);
    if (users.length > 0) {
      console.log('First user ID:', users[0].id);
      console.log('First user Email:', users[0].email);
    }
  }
}

inspect();
