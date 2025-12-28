import { getServerSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import UnlearnAppLayoutClient from './layout-client';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession();

    // 未登录用户重定向到营销落地页
    if (!session) {
        redirect('/unlearn');
    }

    return <UnlearnAppLayoutClient>{children}</UnlearnAppLayoutClient>;
}
