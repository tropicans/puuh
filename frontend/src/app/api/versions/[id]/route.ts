import { NextRequest, NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await fetchFromBackend<any>('/api/versions/' + id, { method: 'GET' });
    if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: res.status || 500 });
    }
    return NextResponse.json(res.data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();
    const res = await fetchFromBackend<any>('/api/versions/' + id, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
    if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: res.status || 500 });
    }
    return NextResponse.json(res.data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await fetchFromBackend<any>('/api/versions/' + id, { method: 'DELETE' });
    if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: res.status || 500 });
    }
    return NextResponse.json(res.data);
}
