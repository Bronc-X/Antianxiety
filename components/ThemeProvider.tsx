'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

/**
 * ThemeProvider Component
 * 
 * Wraps the application with next-themes provider for dark/light mode support.
 * Follows system preference by default with manual override capability.
 * 
 * Requirements: 6.2 - Root layout with theme configuration
 * Requirements: 3.4 - Dark mode toggle support
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
