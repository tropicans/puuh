import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/actions/regulations';

export async function GET() {
    const result = await checkDatabaseConnection();
    return NextResponse.json(result);
}
