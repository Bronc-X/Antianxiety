import { getServerSession } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession();
    
    return NextResponse.json({
      success: true,
      session: session,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug API 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      session: null,
      timestamp: new Date().toISOString(),
    });
  }
}
