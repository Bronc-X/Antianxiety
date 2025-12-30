'use client';

import { useFeed } from '@/hooks/domain/useFeed';
import { DesktopFeed } from '@/components/desktop';
import { MobileFeed } from '@/components/mobile';

interface V2FeedClientProps {
    isMobile: boolean;
}

export function V2FeedClient({ isMobile }: V2FeedClientProps) {
    const feed = useFeed();

    if (isMobile) {
        return <MobileFeed feed={feed} />;
    }

    return <DesktopFeed feed={feed} />;
}
