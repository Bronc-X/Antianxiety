import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  });
}
