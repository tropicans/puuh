import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authorization';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3007';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        const backendFormData = new FormData();
        backendFormData.append('file', file);

        const response = await fetch(`${BACKEND_URL}/api/versions/${id}/reupload`, {
            method: 'POST',
            body: backendFormData,
            headers: {
                'X-User-Id': user.id,
                'X-User-Role': user.role,
            }
        });

        const data = await response.json();
        if (!response.ok) {
            return NextResponse.json({ success: false, error: data.error || 'Failed to re-upload' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Re-upload proxy error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to re-upload'
        }, { status: 500 });
    }
}
