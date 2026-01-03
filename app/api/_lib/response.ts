import { NextResponse } from 'next/server';

export const jsonError = (message: string, status: number) => {
  return NextResponse.json({ error: message }, { status });
};
