import { getServerSession } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';
import { isAdminToken } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const adminRequired = isProd || !!process.env.ADMIN_API_KEY;
    if (adminRequired && !isAdminToken(request.headers)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

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
