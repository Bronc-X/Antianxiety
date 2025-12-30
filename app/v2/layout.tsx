import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AntiAnxiety V2',
    description: '对抗焦虑，解锁身体潜能',
};

export default function V2Layout({
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
