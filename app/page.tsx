import { getServerSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';

// Mark as dynamic route because we use cookies
export const dynamic = 'force-dynamic';

/**
 * Homepage - Redirects to Unlearn App
 */
export default async function Home() {
  const session = await getServerSession();

  // If user is logged in, redirect to unlearn app dashboard
  if (session) {
    return redirect('/unlearn/app');
  }

  // If not logged in, redirect to Unlearn landing
  return redirect('/unlearn');
}

