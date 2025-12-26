'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

/**
 * ThemeProvider Component
 * 
 * Wraps the application with next-themes provider for dark/light/system mode support.
 * Supports 3 themes: light, dark, and system (follows OS preference).
 * 
 * Requirements: 6.2 - Root layout with theme configuration
 * Requirements: 3.4 - Dark mode toggle support
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      themes={['light', 'dark', 'system']}
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;

