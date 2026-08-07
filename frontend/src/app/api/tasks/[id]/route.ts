import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authorization';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3007';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
            headers: {
                'X-User-Id': user.id,
                'X-User-Role': user.role,
            }
        });

        const data = await response.json();
        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: data.error || `HTTP Error ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Task status fetch proxy error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Gagal memantau status tugas'
        }, { status: 500 });
    }
}
