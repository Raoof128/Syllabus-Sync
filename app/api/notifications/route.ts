import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError } from '@/app/api/_lib/response';
import { mapNotificationRow } from '@/app/api/_lib/mappers';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(data?.map(mapNotificationRow) ?? []);
}
