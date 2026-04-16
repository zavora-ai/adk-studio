/**
 * Variable Interpolation Utilities for ADK Studio
 * 
 * Provides functions for interpolating {{variable}} syntax in strings.
 * Used by HTTP nodes and other action nodes that support variable substitution.
 * 
 * @see Requirement 3.1: URL field with variable interpolation {{variable}}
 */

/**
 * Regular expression to match variable placeholders.
 * Matches {{variableName}} or {{nested.path.value}}
 */
export const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * Checks if a string contains variable placeholders.
 * 
 * @param template - The string to check
 * @returns true if the string contains {{variable}} patterns
 */
export function hasVariables(template: string): boolean {
  if (!template || typeof template !== 'string') {
    return false;
  }
  // Use a new regex without the global flag to avoid state issues
  const pattern = /\{\{[^}]+\}\}/;
  return pattern.test(template);
}

/**
 * Extracts all variable names from a template string.
 * 
 * @param template - The template string containing {{variable}} patterns
 * @returns Array of variable names (without the {{ }} delimiters)
 */
export function extractVariables(template: string): string[] {
  if (!template || typeof template !== 'string') {
    return [];
  }
  
  const matches: string[] = [];
  const regex = new RegExp(VARIABLE_PATTERN.source, 'g');
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    const varName = match[1].trim();
    if (varName && !matches.includes(varName)) {
      matches.push(varName);
    }
  }
  
  return matches;
}

/**
 * Gets a nested value from an object using dot notation.
 * 
 * @param obj - The object to get the value from
 * @param path - The dot-notation path (e.g., "user.profile.name")
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || typeof obj !== 'object' || !path) {
    return undefined;
  }
  
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

/**
 * Converts a value to a string for interpolation.
 * 
 * @param value - The value to convert
 * @returns String representation of the value
 */
export function valueToString(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Interpolates variables in a template string using values from a state object.
 * 
 * Supports:
 * - Simple variables: {{name}} -> state.name
 * - Nested paths: {{user.profile.name}} -> state.user.profile.name
 * - Missing variables are replaced with empty string
 * 
 * @param template - The template string with {{variable}} placeholders
 * @param state - The state object containing variable values
 * @returns The interpolated string with variables replaced
 * 
 * @example
 * ```typescript
 * const url = "https://api.example.com/users/{{userId}}/posts";
 * const state = { userId: "123" };
 * const result = interpolateVariables(url, state);
 * // result: "https://api.example.com/users/123/posts"
 * ```
 */
export function interpolateVariables(
  template: string,
  state: Record<string, unknown>
): string {
  if (!template || typeof template !== 'string') {
    return template ?? '';
  }
  
  if (!state || typeof state !== 'object') {
    // If no state provided, remove all variable placeholders
    return template.replace(VARIABLE_PATTERN, '');
  }
  
  return template.replace(VARIABLE_PATTERN, (_match, varPath) => {
    const trimmedPath = varPath.trim();
    const value = getNestedValue(state, trimmedPath);
    return valueToString(value);
  });
}

/**
 * Validates that all variables in a template have corresponding values in state.
 * 
 * @param template - The template string with {{variable}} placeholders
 * @param state - The state object containing variable values
 * @returns Object with validation result and list of missing variables
 */
export function validateVariables(
  template: string,
  state: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const variables = extractVariables(template);
  const missing: string[] = [];
  
  for (const varPath of variables) {
    const value = getNestedValue(state, varPath);
    if (value === undefined) {
      missing.push(varPath);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Creates a preview of the interpolated string, showing which variables
 * will be replaced and which are missing.
 * 
 * @param template - The template string with {{variable}} placeholders
 * @param state - The state object containing variable values
 * @returns Preview string with resolved and unresolved variables marked
 */
export function previewInterpolation(
  template: string,
  state: Record<string, unknown>
): string {
  if (!template || typeof template !== 'string') {
    return template ?? '';
  }
  
  return template.replace(VARIABLE_PATTERN, (_match, varPath) => {
    const trimmedPath = varPath.trim();
    const value = getNestedValue(state, trimmedPath);
    
    if (value === undefined) {
      return `[MISSING: ${trimmedPath}]`;
    }
    
    const strValue = valueToString(value);
    return `[${strValue}]`;
  });
}
