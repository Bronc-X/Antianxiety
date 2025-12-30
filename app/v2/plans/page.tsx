import { headers } from 'next/headers';
import { V2PlansClient } from './V2PlansClient';

export const dynamic = 'force-dynamic';

function isMobileDevice(userAgent: string): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
    );
}

export default async function V2PlansPage() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const capacitorPlatform = headersList.get('x-capacitor-platform');

    const isMobile = !!(capacitorPlatform || isMobileDevice(userAgent));

    return <V2PlansClient isMobile={isMobile} />;
}
