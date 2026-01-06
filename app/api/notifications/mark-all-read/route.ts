import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError } from '@/app/api/_lib/response';

export async function PUT() {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
    .select('id');

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({
    updated: data?.length ?? 0,
    message: 'All notifications marked as read',
  });
}
