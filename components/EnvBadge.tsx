'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { isNative } from '@/lib/capacitor';

type BadgeState = {
  title: string;
  detail: string;
  show: boolean;
};

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  );
}

export default function EnvBadge() {
  const [state, setState] = useState<BadgeState | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const hostname = url.hostname;
    const isLocal = isLocalHostname(hostname);
    const nativeRuntime = isNative();
    const platform = nativeRuntime ? Capacitor.getPlatform().toUpperCase() : 'WEB';
    const mode = isLocal ? 'DEV' : 'PROD';
    const route = url.pathname.startsWith('/native') ? 'NATIVE' : 'WEB';
    const hostLabel = `${hostname}${url.port ? `:${url.port}` : ''}`;

    const show = isLocal || process.env.NODE_ENV !== 'production' || url.searchParams.has('env');

    setState({
      title: `${platform} · ${mode}`,
      detail: `${route} · ${hostLabel}`,
      show,
    });
  }, []);

  if (!state?.show) return null;

  return (
    <div className="fixed top-3 right-3 z-[9999] pointer-events-none">
      <div className="rounded-full bg-black/70 text-white text-[11px] px-3 py-1 shadow-lg tracking-wide">
        <span className="font-semibold">{state.title}</span>
        <span className="mx-2 text-white/50">•</span>
        <span className="text-white/80">{state.detail}</span>
      </div>
    </div>
  );
}
