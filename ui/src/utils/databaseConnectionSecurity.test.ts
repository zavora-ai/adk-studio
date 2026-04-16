/**
 * Database Connection Security Property Tests
 * 
 * Property-based tests for database connection security utilities.
 * Validates that connection strings are properly validated, masked,
 * and security levels are correctly determined.
 * 
 * **Property 8: Database Connection Security**
 * **Validates: Requirements 11.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateConnection,
  // determineSecurityLevel is used in property tests below
  hasPlaintextCredentials,
  hasVariableInterpolation,
  isLocalConnection,
  isValidCredentialRef,
  maskConnectionString,
  extractHost,
  extractDatabaseName,
  createDefaultConnection,
  createSecureConnection,
  getConnectionSummary,
  isConnectionConfigured,
  DEFAULT_POOL_SIZES,
  MAX_POOL_SIZES,
  SENSITIVE_PATTERNS,
  CONNECTION_STRING_PATTERNS,
} from './databaseConnectionSecurity';
import type { DatabaseConnection, DatabaseType } from '../types/actionNodes';

// ============================================
// Arbitraries (Generators)
// ============================================

const arbDatabaseType = fc.constantFrom<DatabaseType>(
  'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis'
);

const arbPoolSize = fc.integer({ min: 1, max: 100 });

const arbCredentialRef = fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/);

const arbVariableInterpolation = fc.stringMatching(/\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/);

// Password generator - ONLY alphanumeric to avoid URL parsing issues
// Characters like @ : / ? # & = ; have special meaning in URLs and connection strings
const arbPlaintextPassword = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
  { minLength: 8, maxLength: 16 }
);

// Hostname - simple alphanumeric with valid TLD
const arbHostname = fc.tuple(
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 10 }),
  fc.constantFrom('com', 'org', 'io', 'net')
).map(([name, tld]) => `${name}.${tld}`);

// Database name - alphanumeric with underscores only
const arbDatabaseName = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')),
  { minLength: 3, maxLength: 10 }
).filter(s => /^[a-z]/.test(s)); // Must start with a letter

// Generate connection strings for different database types
function arbConnectionString(dbType: DatabaseType): fc.Arbitrary<string> {
  switch (dbType) {
    case 'postgresql':
      return fc.tuple(arbHostname, arbDatabaseName).map(
        ([host, db]) => `postgresql://user:password@${host}:5432/${db}`
      );
    case 'mysql':
      return fc.tuple(arbHostname, arbDatabaseName).map(
        ([host, db]) => `mysql://user:password@${host}:3306/${db}`
      );
    case 'sqlite':
      return arbDatabaseName.map(db => `./${db}.sqlite`);
    case 'mongodb':
      return fc.tuple(arbHostname, arbDatabaseName).map(
        ([host, db]) => `mongodb://user:password@${host}:27017/${db}`
      );
    case 'redis':
      return arbHostname.map(host => `redis://${host}:6379`);
  }
}

function arbConnection(dbType: DatabaseType): fc.Arbitrary<DatabaseConnection> {
  return fc.record({
    connectionString: fc.oneof(
      arbConnectionString(dbType),
      fc.constant('')
    ),
    credentialRef: fc.option(arbCredentialRef, { nil: undefined }),
    poolSize: fc.option(arbPoolSize, { nil: undefined }),
  });
}

// ============================================
// Property Tests
// ============================================

describe('Database Connection Security - Property Tests', () => {
  
  // ------------------------------------------
  // Property 1: Validation always returns valid structure
  // ------------------------------------------
  describe('Property 1: Validation Result Structure', () => {
    it('should always return a valid ConnectionValidationResult structure', () => {
      fc.assert(
        fc.property(
          arbDatabaseType,
          arbConnection('postgresql'),
          (dbType, connection) => {
            const result = validateConnection(connection, dbType);
            
            // Structure validation
            expect(typeof result.isValid).toBe('boolean');
            expect(['secure', 'warning', 'insecure']).toContain(result.securityLevel);
            expect(Array.isArray(result.warnings)).toBe(true);
            expect(Array.isArray(result.errors)).toBe(true);
            
            // All warnings and errors should be strings
            result.warnings.forEach(w => expect(typeof w).toBe('string'));
            result.errors.forEach(e => expect(typeof e).toBe('string'));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 2: Empty connection is invalid
  // ------------------------------------------
  describe('Property 2: Empty Connection Validation', () => {
    it('should mark empty connections as invalid', () => {
      fc.assert(
        fc.property(
          arbDatabaseType,
          (dbType) => {
            const emptyConnection: DatabaseConnection = {
              connectionString: '',
              credentialRef: undefined,
            };
            
            const result = validateConnection(emptyConnection, dbType);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 3: Credential reference is more secure
  // ------------------------------------------
  describe('Property 3: Credential Reference Security', () => {
    it('should rate credential reference connections as secure', () => {
      fc.assert(
        fc.property(
          arbDatabaseType,
          arbCredentialRef,
          (dbType, credRef) => {
            const connection: DatabaseConnection = {
              connectionString: '',
              credentialRef: credRef,
            };
            
            const result = validateConnection(connection, dbType);
            
            // Should be valid and secure when using credential reference
            expect(result.isValid).toBe(true);
            expect(result.securityLevel).toBe('secure');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 4: Plaintext credentials detection
  // ------------------------------------------
  describe('Property 4: Plaintext Credentials Detection', () => {
    it('should detect plaintext passwords in connection strings', () => {
      fc.assert(
        fc.property(
          arbPlaintextPassword,
          arbHostname,
          (password, host) => {
            const connectionString = `postgresql://user:${password}@${host}:5432/db`;
            
            expect(hasPlaintextCredentials(connectionString)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should not flag variable interpolation as plaintext credentials', () => {
      fc.assert(
        fc.property(
          arbHostname,
          (host) => {
            const connectionString = `postgresql://user:{{DB_PASSWORD}}@${host}:5432/db`;
            
            expect(hasPlaintextCredentials(connectionString)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 5: Variable interpolation detection
  // ------------------------------------------
  describe('Property 5: Variable Interpolation Detection', () => {
    it('should detect variable interpolation patterns', () => {
      fc.assert(
        fc.property(
          arbVariableInterpolation,
          fc.string(),
          (variable, prefix) => {
            const connectionString = `${prefix}${variable}`;
            
            expect(hasVariableInterpolation(connectionString)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should not detect interpolation in plain strings', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9:/@._-]+$/),
          (plainString) => {
            // Ensure no {{ }} patterns
            if (!plainString.includes('{{')) {
              expect(hasVariableInterpolation(plainString)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 6: Local connection detection
  // ------------------------------------------
  describe('Property 6: Local Connection Detection', () => {
    it('should detect localhost connections', () => {
      const localPatterns = ['localhost', '127.0.0.1', '::1'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...localPatterns),
          arbDatabaseName,
          (host, db) => {
            const connectionString = `postgresql://user:pass@${host}:5432/${db}`;
            
            expect(isLocalConnection(connectionString)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should not flag remote connections as local', () => {
      fc.assert(
        fc.property(
          arbHostname,
          (host) => {
            // Ensure host doesn't contain local patterns
            if (!host.includes('local') && !host.includes('dev') && !host.includes('test')) {
              const connectionString = `postgresql://user:pass@${host}:5432/db`;
              expect(isLocalConnection(connectionString)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 7: Credential reference format validation
  // ------------------------------------------
  describe('Property 7: Credential Reference Format', () => {
    it('should validate correct credential reference formats', () => {
      fc.assert(
        fc.property(
          arbCredentialRef,
          (ref) => {
            expect(isValidCredentialRef(ref)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should reject invalid credential reference formats', () => {
      const invalidRefs = ['123abc', '-invalid', 'has space', 'has.too.many.dots', ''];
      
      invalidRefs.forEach(ref => {
        expect(isValidCredentialRef(ref)).toBe(false);
      });
    });
  });
  
  // ------------------------------------------
  // Property 8: Connection string masking
  // ------------------------------------------
  describe('Property 8: Connection String Masking', () => {
    it('should mask passwords in URL format', () => {
      fc.assert(
        fc.property(
          arbPlaintextPassword,
          arbHostname,
          (password, host) => {
            const connectionString = `postgresql://user:${password}@${host}:5432/db`;
            const masked = maskConnectionString(connectionString);
            
            // Password should be masked
            expect(masked).not.toContain(password);
            expect(masked).toContain(':***@');
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should mask password parameters', () => {
      fc.assert(
        fc.property(
          arbPlaintextPassword,
          (password) => {
            const connectionString = `host=localhost;password=${password};database=test`;
            const masked = maskConnectionString(connectionString);
            
            expect(masked).not.toContain(password);
            expect(masked).toContain('password=***');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 9: Host extraction
  // ------------------------------------------
  describe('Property 9: Host Extraction', () => {
    it('should extract host from URL format connection strings', () => {
      fc.assert(
        fc.property(
          arbHostname,
          arbDatabaseName,
          (host, db) => {
            const connectionString = `postgresql://user:pass@${host}:5432/${db}`;
            const extracted = extractHost(connectionString);
            
            expect(extracted).toBe(host);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 10: Database name extraction
  // ------------------------------------------
  describe('Property 10: Database Name Extraction', () => {
    it('should extract database name from URL format', () => {
      fc.assert(
        fc.property(
          arbHostname,
          arbDatabaseName,
          (host, db) => {
            const connectionString = `postgresql://user:pass@${host}:5432/${db}`;
            const extracted = extractDatabaseName(connectionString);
            
            expect(extracted).toBe(db);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 11: Default connection creation
  // ------------------------------------------
  describe('Property 11: Default Connection Creation', () => {
    it('should create connections with correct default pool sizes', () => {
      fc.assert(
        fc.property(
          arbDatabaseType,
          (dbType) => {
            const connection = createDefaultConnection(dbType);
            
            expect(connection.connectionString).toBe('');
            expect(connection.poolSize).toBe(DEFAULT_POOL_SIZES[dbType]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 12: Secure connection creation
  // ------------------------------------------
  describe('Property 12: Secure Connection Creation', () => {
    it('should create secure connections with credential references', () => {
      fc.assert(
        fc.property(
          arbCredentialRef,
          arbDatabaseType,
          (credRef, dbType) => {
            const connection = createSecureConnection(credRef, dbType);
            
            expect(connection.connectionString).toBe('');
            expect(connection.credentialRef).toBe(credRef);
            expect(connection.poolSize).toBe(DEFAULT_POOL_SIZES[dbType]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 13: Connection configured check
  // ------------------------------------------
  describe('Property 13: Connection Configured Check', () => {
    it('should correctly identify configured connections', () => {
      fc.assert(
        fc.property(
          arbDatabaseType,
          arbConnection('postgresql'),
          (_dbType, connection) => {
            const isConfigured = isConnectionConfigured(connection);
            const hasConfig = !!(connection.connectionString || connection.credentialRef);
            
            expect(isConfigured).toBe(hasConfig);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 14: Security level consistency
  // ------------------------------------------
  describe('Property 14: Security Level Consistency', () => {
    it('should have consistent security levels based on configuration', () => {
      fc.assert(
        fc.property(
          arbDatabaseType,
          (dbType) => {
            // Credential reference only = secure
            const secureConnection: DatabaseConnection = {
              connectionString: '',
              credentialRef: 'credentials.DB_URL',
            };
            const secureResult = validateConnection(secureConnection, dbType);
            expect(secureResult.securityLevel).toBe('secure');
            
            // Variable interpolation = secure
            const interpolatedConnection: DatabaseConnection = {
              connectionString: 'postgresql://{{DB_USER}}:{{DB_PASS}}@host:5432/db',
            };
            const interpolatedResult = validateConnection(interpolatedConnection, dbType);
            expect(interpolatedResult.securityLevel).toBe('secure');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 15: Pool size validation
  // ------------------------------------------
  describe('Property 15: Pool Size Validation', () => {
    it('should warn when pool size exceeds maximum', () => {
      fc.assert(
        fc.property(
          arbDatabaseType,
          (dbType) => {
            const maxPool = MAX_POOL_SIZES[dbType];
            const connection: DatabaseConnection = {
              connectionString: 'postgresql://user:pass@host:5432/db',
              poolSize: maxPool + 10,
            };
            
            const result = validateConnection(connection, dbType);
            
            // Should have a warning about pool size
            const hasPoolWarning = result.warnings.some(w => 
              w.toLowerCase().includes('pool') && w.toLowerCase().includes('maximum')
            );
            expect(hasPoolWarning).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should warn about SQLite pool size', () => {
      const connection: DatabaseConnection = {
        connectionString: './test.sqlite',
        poolSize: 5,
      };
      
      const result = validateConnection(connection, 'sqlite');
      
      const hasSqliteWarning = result.warnings.some(w => 
        w.toLowerCase().includes('sqlite') && w.toLowerCase().includes('pool')
      );
      expect(hasSqliteWarning).toBe(true);
    });
  });
  
  // ------------------------------------------
  // Property 16: Connection summary generation
  // ------------------------------------------
  describe('Property 16: Connection Summary', () => {
    it('should generate safe summaries without exposing credentials', () => {
      fc.assert(
        fc.property(
          arbPlaintextPassword,
          arbHostname,
          arbDatabaseName,
          (password, host, db) => {
            const connection: DatabaseConnection = {
              connectionString: `postgresql://user:${password}@${host}:5432/${db}`,
            };
            
            const summary = getConnectionSummary(connection, 'postgresql');
            
            // Summary should not contain the password
            expect(summary).not.toContain(password);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should show credential reference in summary', () => {
      fc.assert(
        fc.property(
          arbCredentialRef,
          arbDatabaseType,
          (credRef, dbType) => {
            const connection: DatabaseConnection = {
              connectionString: '',
              credentialRef: credRef,
            };
            
            const summary = getConnectionSummary(connection, dbType);
            
            expect(summary).toContain(credRef);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 17: Sensitive patterns coverage
  // ------------------------------------------
  describe('Property 17: Sensitive Patterns Coverage', () => {
    it('should have patterns for common sensitive parameters', () => {
      const sensitiveParams = ['password', 'api_key', 'secret', 'token', 'auth'];
      
      sensitiveParams.forEach(param => {
        const hasPattern = SENSITIVE_PATTERNS.some(({ pattern }) => 
          pattern.test(`${param}=value123`)
        );
        expect(hasPattern).toBe(true);
      });
    });
  });
  
  // ------------------------------------------
  // Property 18: Connection string patterns
  // ------------------------------------------
  describe('Property 18: Connection String Patterns', () => {
    it('should have patterns for all database types', () => {
      const dbTypes: DatabaseType[] = ['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis'];
      
      dbTypes.forEach(dbType => {
        expect(CONNECTION_STRING_PATTERNS[dbType]).toBeDefined();
        expect(CONNECTION_STRING_PATTERNS[dbType]).toBeInstanceOf(RegExp);
      });
    });
  });
  
  // ------------------------------------------
  // Property 19: Default pool sizes
  // ------------------------------------------
  describe('Property 19: Default Pool Sizes', () => {
    it('should have reasonable default pool sizes for all database types', () => {
      fc.assert(
        fc.property(
          arbDatabaseType,
          (dbType) => {
            const defaultSize = DEFAULT_POOL_SIZES[dbType];
            const maxSize = MAX_POOL_SIZES[dbType];
            
            expect(defaultSize).toBeGreaterThanOrEqual(1);
            expect(defaultSize).toBeLessThanOrEqual(maxSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ------------------------------------------
  // Property 20: Errors imply invalid
  // ------------------------------------------
  describe('Property 20: Errors Imply Invalid', () => {
    it('should mark connections with errors as invalid', () => {
      fc.assert(
        fc.property(
          arbDatabaseType,
          arbConnection('postgresql'),
          (dbType, connection) => {
            const result = validateConnection(connection, dbType);
            
            if (result.errors.length > 0) {
              expect(result.isValid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
