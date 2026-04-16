/**
 * ThemeToggle component for ADK Studio v2.0
 * 
 * Provides a sun/moon icon toggle button for switching between themes.
 * 
 * Requirements: 1.8
 */

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  /** Optional additional CSS classes */
  className?: string;
  /** Size of the icon in pixels */
  size?: number;
}

/**
 * ThemeToggle renders a button that toggles between light and dark themes.
 * Shows a sun icon in dark mode (to switch to light) and moon icon in light mode (to switch to dark).
 */
export function ThemeToggle({ className = '', size = 18 }: ThemeToggleProps) {
  const { mode, toggle } = useTheme();
  const isLight = mode === 'light';

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-md transition-colors ${className}`}
      style={{
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLight ? (
        <Moon size={size} className="transition-transform" />
      ) : (
        <Sun size={size} className="transition-transform" />
      )}
    </button>
  );
}

export default ThemeToggle;
