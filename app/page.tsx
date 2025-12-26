import { getServerSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';

// Mark as dynamic route because we use cookies
export const dynamic = 'force-dynamic';

/**
 * Homepage - English Version
 * Redirects to Brutalist landing page
 */
export default async function Home() {
  const session = await getServerSession();

  // If user is logged in, redirect to dashboard
  if (session) {
    return redirect('/brutalist/dashboard');
  }

  // If not logged in, redirect to Brutalist landing
  return redirect('/brutalist');
}

