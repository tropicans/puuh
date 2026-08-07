import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/api';

export async function GET() {
    const res = await fetchFromBackend<any>('/api/regulations', { method: 'GET' });
    if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: res.status || 500 });
    }
    return NextResponse.json(res.data);
}
