/**
 * V2 Login Page
 * 
 * 重定向到现有 login 流程
 */

import { redirect } from 'next/navigation';

export default function V2LoginPage() {
    redirect('/login');
}
