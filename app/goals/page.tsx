/**
 * Goals Page (Server Component)
 * 
 * MVVM Architecture - Page Router Layer
 */

import { detectMobileDevice } from '@/lib/device-detection';
import { GoalsClient } from './GoalsClient';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
    const isMobile = await detectMobileDevice();

    return <GoalsClient isMobile={isMobile} />;
}
