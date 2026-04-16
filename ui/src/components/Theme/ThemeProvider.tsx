/**
 * ThemeProvider component for ADK Studio v2.0
 * 
 * Applies CSS variables to document root based on active theme.
 * Wraps the application to provide theme context.
 * 
 * Requirements: 1.3, 1.9
 */

import { useEffect, type ReactNode } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider applies the current theme to the document root
 * by setting the data-theme attribute, which triggers CSS variable changes.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const mode = useTheme((state) => state.mode);

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', mode);
    
    // Also update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        mode === 'light' ? '#F7F8FA' : '#1a1a2e'
      );
    }
  }, [mode]);

  return <>{children}</>;
}

export default ThemeProvider;
