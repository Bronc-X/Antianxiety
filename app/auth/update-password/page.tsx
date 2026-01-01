import { redirect } from 'next/navigation';

export default function UpdatePasswordRedirect() {
  redirect('/unlearn/update-password');
}
