import { auth } from '@/lib/auth';

export type CurrentUser = {
    id: string;
    role: string;
    email?: string;
    name?: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    return {
        id: session.user.id,
        role: session.user.role ?? 'VIEWER',
        email: session.user.email,
        name: session.user.name,
    };
}

export function isAdminRole(role?: string | null): boolean {
    return role === 'ADMIN';
}
