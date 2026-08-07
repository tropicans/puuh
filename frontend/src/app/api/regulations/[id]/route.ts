import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/api';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const res = await fetchFromBackend<any>('/api/regulations/' + id, { method: 'GET' });
    if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: res.status || 500 });
    }
    return NextResponse.json(res.data);
}
