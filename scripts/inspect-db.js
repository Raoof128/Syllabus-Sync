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

  console.log('\nChecking table: units');
  const { data: units, error: unitsError } = await supabase.from('units').select('*').limit(1);
  if (unitsError) {
    console.error('Error querying units:', unitsError);
  } else {
    console.log('Successfully queried units. Row count:', units.length);
    if (units.length > 0) {
      const unit = units[0];
      console.log('Sample row keys:', Object.keys(unit));
      console.log('Has "location" column:', 'location' in unit);
      console.log('Has "building" column:', 'building' in unit);
      console.log('Has "room" column:', 'room' in unit);
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
