// import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError } from '@/app/api/_lib/response';

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return jsonError(error.message, 400);
    }

    return jsonSuccess({ message: 'Signout successful' });
  } catch (error) {
    console.error('Signout error:', error);
    return jsonError('Internal server error', 500);
  }
}
