'use client';

/**
 * ExternalLink Component
 * Requirements: 5.5
 * 
 * A component for opening external links using the useBrowser hook.
 * On native platforms, opens links in an in-app browser.
 * On web, opens links in a new tab.
 */

import React from 'react';
import { useBrowser } from '@/hooks/useBrowser';
import { cn } from '@/lib/utils';

export interface ExternalLinkProps {
  /** The URL to open */
  href: string;
  /** Content to render inside the link */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show an external link icon */
  showIcon?: boolean;
  /** Accessible label for the link */
  'aria-label'?: string;
}

/**
 * ExternalLink component that uses Capacitor Browser on native platforms
 * and window.open on web platforms.
 */
export function ExternalLink({
  href,
  children,
  className,
  showIcon = false,
  'aria-label': ariaLabel,
}: ExternalLinkProps) {
  const { open } = useBrowser();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    await open(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 text-primary hover:underline cursor-pointer',
        className
      )}
      aria-label={ariaLabel}
      rel="noopener noreferrer"
    >
      {children}
      {showIcon && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="inline-block"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      )}
    </a>
  );
}

export default ExternalLink;
