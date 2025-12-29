/**
 * Plans Page (Server Component)
 * 
 * MVVM Architecture - Page Router Layer
 */

import { detectMobileDevice } from '@/lib/device-detection';
import { PlansClient } from './PlansClient';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const isMobile = await detectMobileDevice();

  return <PlansClient isMobile={isMobile} />;
}
