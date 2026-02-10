import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/actions/regulations';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminRole(user.role)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const result = await checkDatabaseConnection();
    return NextResponse.json(result);
}
