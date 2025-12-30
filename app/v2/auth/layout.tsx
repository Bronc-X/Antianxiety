import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AntiAnxiety - 登录',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950">
            {children}
        </div>
    );
}
