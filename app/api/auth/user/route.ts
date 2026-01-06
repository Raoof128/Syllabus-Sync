// import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError } from '@/app/api/_lib/response';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return jsonError('Not authenticated', 401);
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "not found"
      console.warn('Profile fetch error:', profileError);
    }

    return jsonSuccess({
      user,
      profile: profile || null,
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return jsonError('Internal server error', 500);
  }
}
