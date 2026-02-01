import { NextResponse } from 'next/server';
import { testVisionAPI } from '@/lib/ocr-service';

export async function GET() {
    const result = await testVisionAPI();
    return NextResponse.json(result);
}
