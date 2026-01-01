import { getServerSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';

// Mark as dynamic route because we use cookies
export const dynamic = 'force-dynamic';

/**
 * Homepage - Redirects to Unlearn App
 */
export default async function Home() {
  const session = await getServerSession();

  // Always land on Unlearn for desktop; mobile is handled in middleware.
  if (session) {
    return redirect('/unlearn');
  }

  return redirect('/unlearn');
}

