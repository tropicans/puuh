import { getCurrentUser, isAdminRole } from '@/lib/authorization';
import { redirect } from 'next/navigation';

export default async function ManageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user || !isAdminRole(user.role)) {
        redirect('/login');
    }

    return <>{children}</>;
}
