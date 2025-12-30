import { headers } from 'next/headers';
import { V2FeedClient } from './V2FeedClient';

export const dynamic = 'force-dynamic';

function isMobileDevice(userAgent: string): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
    );
}

export default async function V2FeedPage() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const capacitorPlatform = headersList.get('x-capacitor-platform');

    const isMobile = !!(capacitorPlatform || isMobileDevice(userAgent));

    return <V2FeedClient isMobile={isMobile} />;
}
