import { NextResponse } from 'next/server';
import { getDigitalTwinDebugData } from '@/app/actions/debug-twin';

export async function GET() {
    const result = await getDigitalTwinDebugData();
    return NextResponse.json(result, { status: result.success ? 200 : 401 });
}
