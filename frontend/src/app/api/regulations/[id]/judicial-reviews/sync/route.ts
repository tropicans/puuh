import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/api';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const res = await fetchFromBackend<any>('/api/regulations/' + id + '/judicial-reviews/sync', {
        method: 'POST'
    });
    if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: res.status || 500 });
    }
    return NextResponse.json(res.data);
}
