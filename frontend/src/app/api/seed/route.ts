import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/api';

export async function POST() {
    const res = await fetchFromBackend<any>('/api/seed', { method: 'POST' });
    if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: res.status || 500 });
    }
    return NextResponse.json(res.data);
}
