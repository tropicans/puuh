import { NextResponse } from 'next/server';
import { testVisionAPI } from '@/lib/ocr-service';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminRole(user.role)) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const result = await testVisionAPI();
    return NextResponse.json(result);
}
