/**
 * Theme type definitions and token constants for ADK Studio v2.0
 * 
 * Supports both light and dark color modes with CSS variable-based theming.
 * Requirements: 1.1, 1.3
 */

export type ThemeMode = 'light' | 'dark';

/**
 * Theme token interface defining all color values used throughout the application.
 * These tokens are mapped to CSS custom properties for seamless theme switching.
 */
export interface ThemeTokens {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgCanvas: string;
  
  // Surfaces
  surfaceCard: string;
  surfacePanel: string;
  
  // Borders
  borderDefault: string;
  borderFocus: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Accents
  accentPrimary: string;    // Deep teal for ADK distinct branding
  accentWarning: string;    // Amber for warnings
  accentSuccess: string;    // Green for success states
  accentError: string;      // Red for error states
  
  // Node type colors
  nodeAgent: string;
  nodeSequential: string;
  nodeLoop: string;
  nodeParallel: string;
  nodeRouter: string;
  
  // ReactFlow specific
  gridColor: string;
  handleColor: string;
  minimapMask: string;
  controlsBg: string;
  controlsBorder: string;
}

/**
 * Light theme token values
 * Default theme for new users per Requirement 1.2
 * Uses specific color values from Requirement 1.3:
 * - Background: #F7F8FA
 * - Surface: #FFFFFF
 * - Border: #E3E6EA
 * - Text: #1C232B
 * - Accent Primary: #0F8A8A (deep teal)
 * - Accent Warning: #F59F00 (amber)
 */
export const lightTheme: ThemeTokens = {
  // Backgrounds
  bgPrimary: '#F7F8FA',
  bgSecondary: '#FFFFFF',
  bgCanvas: '#F0F2F5',
  
  // Surfaces
  surfaceCard: '#FFFFFF',
  surfacePanel: '#FFFFFF',
  
  // Borders
  borderDefault: '#E3E6EA',
  borderFocus: '#0F8A8A',
  
  // Text
  textPrimary: '#1C232B',
  textSecondary: '#4A5568',
  textMuted: '#A0AEC0',
  
  // Accents
  accentPrimary: '#0F8A8A',
  accentWarning: '#F59F00',
  accentSuccess: '#38A169',
  accentError: '#E53E3E',
  
  // Node type colors
  nodeAgent: '#3182CE',
  nodeSequential: '#805AD5',
  nodeLoop: '#D69E2E',
  nodeParallel: '#38A169',
  nodeRouter: '#DD6B20',
  
  // ReactFlow specific
  gridColor: '#E3E6EA',
  handleColor: '#0F8A8A',
  minimapMask: 'rgba(247, 248, 250, 0.8)',
  controlsBg: '#FFFFFF',
  controlsBorder: '#E3E6EA',
};

/**
 * Dark theme token values
 * Maintains the existing dark aesthetic while using the new token structure
 */
export const darkTheme: ThemeTokens = {
  // Backgrounds
  bgPrimary: '#1a1a2e',
  bgSecondary: '#16213e',
  bgCanvas: '#0f0f1a',
  
  // Surfaces
  surfaceCard: '#1e2a4a',
  surfacePanel: '#16213e',
  
  // Borders
  borderDefault: '#2d3748',
  borderFocus: '#4fd1c5',
  
  // Text
  textPrimary: '#F7FAFC',
  textSecondary: '#A0AEC0',
  textMuted: '#718096',
  
  // Accents
  accentPrimary: '#4fd1c5',
  accentWarning: '#F6AD55',
  accentSuccess: '#68D391',
  accentError: '#FC8181',
  
  // Node type colors
  nodeAgent: '#63B3ED',
  nodeSequential: '#B794F4',
  nodeLoop: '#F6E05E',
  nodeParallel: '#68D391',
  nodeRouter: '#F6AD55',
  
  // ReactFlow specific
  gridColor: '#333333',
  handleColor: '#e94560',
  minimapMask: 'rgba(0, 0, 0, 0.8)',
  controlsBg: '#16213e',
  controlsBorder: '#e94560',
};

/**
 * Get theme tokens by mode
 */
export function getThemeTokens(mode: ThemeMode): ThemeTokens {
  return mode === 'light' ? lightTheme : darkTheme;
}
