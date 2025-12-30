/**
 * V2 Signup Page
 * 
 * 重定向到现有 signup 流程
 */

import { redirect } from 'next/navigation';

export default function V2SignupPage() {
    redirect('/signup');
}
