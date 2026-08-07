import { NextResponse } from 'next/server';
import { testLLMConnection } from '@/lib/ai-service';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
        }
        if (!isAdminRole(user.role)) {
            return NextResponse.json({ status: 'error', error: 'Forbidden' }, { status: 403 });
        }

        const result = await testLLMConnection();

        return NextResponse.json({
            status: result.success ? 'connected' : 'error',
            model: result.model,
            error: result.error
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
