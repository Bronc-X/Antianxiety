'use client';

// Mobile Light - Layout
// Needs to handle safe areas and enforce light theme regardless of system

export default function MobileLightLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="min-h-screen font-sans text-gray-900 overflow-x-hidden safe-area-inset-bottom"
            style={{ background: '#F5F5F7' }} // Apple-style off-white
        >
            {children}
        </div>
    );
}
