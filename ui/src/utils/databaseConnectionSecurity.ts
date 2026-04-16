/**
 * Database Connection Security Utilities
 * 
 * Provides validation and security utilities for database connections.
 * Ensures connection strings are handled securely and credentials
 * are properly referenced.
 * 
 * @see Requirements 11.2
 */

import type { DatabaseConnection, DatabaseType } from '../types/actionNodes';

// ============================================
// Types
// ============================================

/**
 * Security level for database connections.
 */
export type ConnectionSecurityLevel = 'secure' | 'warning' | 'insecure';

/**
 * Validation result for connection configuration.
 */
export interface ConnectionValidationResult {
  isValid: boolean;
  securityLevel: ConnectionSecurityLevel;
  warnings: string[];
  errors: string[];
}

/**
 * Sensitive patterns that should be masked in logs.
 */
export interface SensitivePattern {
  pattern: RegExp;
  description: string;
}

// ============================================
// Constants
// ============================================

/**
 * Patterns that indicate sensitive data in connection strings.
 */
export const SENSITIVE_PATTERNS: SensitivePattern[] = [
  { pattern: /password=([^&;\s]+)/i, description: 'password parameter' },
  { pattern: /:([^:@]+)@/, description: 'password in URL' },
  { pattern: /api[_-]?key=([^&;\s]+)/i, description: 'API key' },
  { pattern: /secret=([^&;\s]+)/i, description: 'secret parameter' },
  { pattern: /token=([^&;\s]+)/i, description: 'token parameter' },
  { pattern: /auth=([^&;\s]+)/i, description: 'auth parameter' },
];

/**
 * Connection string format patterns for each database type.
 */
export const CONNECTION_STRING_PATTERNS: Record<DatabaseType, RegExp> = {
  postgresql: /^postgres(ql)?:\/\/.+/i,
  mysql: /^mysql:\/\/.+/i,
  sqlite: /^(\.\/|\/|[a-zA-Z]:).+\.sqlite3?$/i,
  mongodb: /^mongodb(\+srv)?:\/\/.+/i,
  redis: /^redis(s)?:\/\/.+/i,
};

/**
 * Default pool sizes for each database type.
 */
export const DEFAULT_POOL_SIZES: Record<DatabaseType, number> = {
  postgresql: 10,
  mysql: 10,
  sqlite: 1, // SQLite doesn't support connection pooling
  mongodb: 10,
  redis: 10,
};

/**
 * Maximum recommended pool sizes.
 */
export const MAX_POOL_SIZES: Record<DatabaseType, number> = {
  postgresql: 100,
  mysql: 100,
  sqlite: 1,
  mongodb: 100,
  redis: 50,
};

// ============================================
// Validation Functions
// ============================================

/**
 * Validates a database connection configuration.
 * 
 * @param connection - The connection configuration to validate
 * @param dbType - The database type
 * @returns Validation result with security level and any warnings/errors
 */
export function validateConnection(
  connection: DatabaseConnection,
  dbType: DatabaseType
): ConnectionValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check if connection string is provided
  if (!connection.connectionString && !connection.credentialRef) {
    errors.push('Either connection string or credential reference is required');
  }
  
  // Validate connection string format if provided
  if (connection.connectionString) {
    const pattern = CONNECTION_STRING_PATTERNS[dbType];
    if (pattern && !pattern.test(connection.connectionString)) {
      warnings.push(`Connection string may not be in the correct format for ${dbType}`);
    }
    
    // Check for plaintext credentials
    if (hasPlaintextCredentials(connection.connectionString)) {
      warnings.push('Connection string appears to contain plaintext credentials');
    }
    
    // Check for localhost/development indicators
    if (isLocalConnection(connection.connectionString)) {
      warnings.push('Connection appears to be for local/development environment');
    }
  }
  
  // Validate pool size
  if (connection.poolSize !== undefined) {
    if (connection.poolSize < 1) {
      errors.push('Pool size must be at least 1');
    }
    
    const maxPool = MAX_POOL_SIZES[dbType];
    if (connection.poolSize > maxPool) {
      warnings.push(`Pool size exceeds recommended maximum of ${maxPool} for ${dbType}`);
    }
    
    if (dbType === 'sqlite' && connection.poolSize > 1) {
      warnings.push('SQLite does not support connection pooling; pool size will be ignored');
    }
  }
  
  // Validate credential reference format
  if (connection.credentialRef) {
    if (!isValidCredentialRef(connection.credentialRef)) {
      warnings.push('Credential reference should be in format: node_id.VARIABLE_NAME');
    }
  }
  
  // Determine security level
  const securityLevel = determineSecurityLevel(connection, warnings, errors);
  
  return {
    isValid: errors.length === 0,
    securityLevel,
    warnings,
    errors,
  };
}

/**
 * Determines the security level based on connection configuration.
 */
export function determineSecurityLevel(
  connection: DatabaseConnection,
  warnings: string[],
  errors: string[]
): ConnectionSecurityLevel {
  if (errors.length > 0) {
    return 'insecure';
  }
  
  // Using credential reference is more secure
  if (connection.credentialRef && !connection.connectionString) {
    return 'secure';
  }
  
  // Check for plaintext credentials in connection string
  if (connection.connectionString && hasPlaintextCredentials(connection.connectionString)) {
    return 'warning';
  }
  
  // Check for variable interpolation (more secure)
  if (connection.connectionString && hasVariableInterpolation(connection.connectionString)) {
    return 'secure';
  }
  
  if (warnings.length > 0) {
    return 'warning';
  }
  
  return 'secure';
}

/**
 * Checks if a connection string contains plaintext credentials.
 */
export function hasPlaintextCredentials(connectionString: string): boolean {
  // Skip check if using variable interpolation
  if (hasVariableInterpolation(connectionString)) {
    return false;
  }
  
  return SENSITIVE_PATTERNS.some(({ pattern }) => pattern.test(connectionString));
}

/**
 * Checks if a connection string uses variable interpolation.
 */
export function hasVariableInterpolation(connectionString: string): boolean {
  return /\{\{[^}]+\}\}/.test(connectionString);
}

/**
 * Checks if a connection appears to be for local/development.
 */
export function isLocalConnection(connectionString: string): boolean {
  const localPatterns = [
    /localhost/i,
    /127\.0\.0\.1/,
    /::1/,
    /\.local\b/i,
    /\.dev\b/i,
    /\.test\b/i,
  ];
  
  return localPatterns.some(pattern => pattern.test(connectionString));
}

/**
 * Validates credential reference format.
 */
export function isValidCredentialRef(ref: string): boolean {
  // Format: node_id.VARIABLE_NAME or just VARIABLE_NAME
  return /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(ref);
}

// ============================================
// Masking Functions
// ============================================

/**
 * Masks sensitive data in a connection string for safe logging.
 * 
 * @param connectionString - The connection string to mask
 * @returns Masked connection string safe for logging
 */
export function maskConnectionString(connectionString: string): string {
  let masked = connectionString;
  
  // Mask password in URL format (user:password@host)
  masked = masked.replace(/:([^:@]+)@/g, ':***@');
  
  // Mask password parameter
  masked = masked.replace(/password=([^&;\s]+)/gi, 'password=***');
  
  // Mask other sensitive parameters
  masked = masked.replace(/api[_-]?key=([^&;\s]+)/gi, 'api_key=***');
  masked = masked.replace(/secret=([^&;\s]+)/gi, 'secret=***');
  masked = masked.replace(/token=([^&;\s]+)/gi, 'token=***');
  masked = masked.replace(/auth=([^&;\s]+)/gi, 'auth=***');
  
  return masked;
}

/**
 * Extracts the host from a connection string (safe for logging).
 */
export function extractHost(connectionString: string): string | null {
  // Try URL format
  const urlMatch = connectionString.match(/@([^:/]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // Try host parameter
  const hostMatch = connectionString.match(/host=([^&;\s]+)/i);
  if (hostMatch) {
    return hostMatch[1];
  }
  
  return null;
}

/**
 * Extracts the database name from a connection string.
 */
export function extractDatabaseName(connectionString: string): string | null {
  // Try URL format (last path segment)
  const urlMatch = connectionString.match(/\/([^/?]+)(?:\?|$)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // Try database parameter
  const dbMatch = connectionString.match(/(?:database|db)=([^&;\s]+)/i);
  if (dbMatch) {
    return dbMatch[1];
  }
  
  return null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Creates a default connection configuration.
 */
export function createDefaultConnection(dbType: DatabaseType): DatabaseConnection {
  return {
    connectionString: '',
    poolSize: DEFAULT_POOL_SIZES[dbType],
  };
}

/**
 * Creates a connection using credential reference (more secure).
 */
export function createSecureConnection(
  credentialRef: string,
  dbType: DatabaseType
): DatabaseConnection {
  return {
    connectionString: '',
    credentialRef,
    poolSize: DEFAULT_POOL_SIZES[dbType],
  };
}

/**
 * Gets a summary of the connection for display.
 */
export function getConnectionSummary(
  connection: DatabaseConnection,
  _dbType: DatabaseType
): string {
  if (connection.credentialRef) {
    return `Using credentials from: ${connection.credentialRef}`;
  }
  
  if (connection.connectionString) {
    const host = extractHost(connection.connectionString);
    const db = extractDatabaseName(connection.connectionString);
    
    if (host && db) {
      return `${host}/${db}`;
    }
    if (host) {
      return host;
    }
    
    return maskConnectionString(connection.connectionString).substring(0, 50) + '...';
  }
  
  return 'No connection configured';
}

/**
 * Checks if connection is configured.
 */
export function isConnectionConfigured(connection: DatabaseConnection): boolean {
  return !!(connection.connectionString || connection.credentialRef);
}
