'use client';

import UnlearnAppLayoutClient from '@/app/unlearn/layout-client';
import AppDashboard from '@/app/unlearn/page';

export default function Home() {
    return (
        <UnlearnAppLayoutClient>
            <AppDashboard />
        </UnlearnAppLayoutClient>
    );
}
