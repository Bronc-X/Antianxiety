/**
 * Dashboard Page (Server Component)
 * 
 * MVVM Architecture - Page Router Layer
 * 
 * This is a Server Component that:
 * - Detects device type from headers
 * - Passes isMobile prop to Client Component
 * - Uses force-dynamic to prevent Vercel edge caching
 * 
 * Requirements: 4.1, 4.5, 4.6, 4.7
 */

import { detectMobileDevice } from '@/lib/device-detection';
import { DashboardClient } from './DashboardClient';

// CRITICAL: Prevent Vercel edge caching of device-specific HTML
// Without this, mobile users might receive cached desktop HTML
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Detect device type from headers (Capacitor header takes priority)
  const isMobile = await detectMobileDevice();
  
  return <DashboardClient isMobile={isMobile} />;
}
