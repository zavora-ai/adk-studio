/**
 * DatabasePanel Component for ADK Studio
 * 
 * Properties panel for configuring Database action nodes.
 * Provides UI for database type selection, connection configuration,
 * and database-specific operations (SQL, MongoDB, Redis).
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 12.2
 */

import { useCallback, useState } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  DatabaseNodeConfig, 
  DatabaseType,
  DatabaseConnection,
  SqlConfig,
  SqlOperation,
  MongoConfig,
  MongoOperation,
  RedisConfig,
  RedisOperation,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/databasePanel.css';

// ============================================
// Constants
// ============================================

const DATABASE_TYPES: readonly DatabaseType[] = ['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis'];

const DATABASE_TYPE_INFO: Record<DatabaseType, { label: string; icon: string; description: string }> = {
  postgresql: { label: 'PostgreSQL', icon: '🐘', description: 'Advanced open-source relational database' },
  mysql: { label: 'MySQL', icon: '🐬', description: 'Popular open-source relational database' },
  sqlite: { label: 'SQLite', icon: '📦', description: 'Lightweight file-based database' },
  mongodb: { label: 'MongoDB', icon: '🍃', description: 'Document-oriented NoSQL database' },
  redis: { label: 'Redis', icon: '⚡', description: 'In-memory key-value store' },
};

const SQL_OPERATIONS: readonly SqlOperation[] = ['query', 'insert', 'update', 'delete', 'upsert'];

const SQL_OPERATION_INFO: Record<SqlOperation, { label: string; description: string; template: string }> = {
  query: { 
    label: 'SELECT', 
    description: 'Retrieve data from database',
    template: 'SELECT * FROM table_name WHERE condition = $1',
  },
  insert: { 
    label: 'INSERT', 
    description: 'Insert new records',
    template: 'INSERT INTO table_name (column1, column2) VALUES ($1, $2) RETURNING *',
  },
  update: { 
    label: 'UPDATE', 
    description: 'Update existing records',
    template: 'UPDATE table_name SET column1 = $1 WHERE id = $2 RETURNING *',
  },
  delete: { 
    label: 'DELETE', 
    description: 'Delete records',
    template: 'DELETE FROM table_name WHERE id = $1 RETURNING *',
  },
  upsert: { 
    label: 'UPSERT', 
    description: 'Insert or update on conflict',
    template: 'INSERT INTO table_name (id, column1) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET column1 = $2 RETURNING *',
  },
};

const MONGO_OPERATIONS: readonly MongoOperation[] = ['find', 'findOne', 'insert', 'update', 'delete'];

const MONGO_OPERATION_INFO: Record<MongoOperation, { label: string; description: string }> = {
  find: { label: 'find()', description: 'Find multiple documents' },
  findOne: { label: 'findOne()', description: 'Find a single document' },
  insert: { label: 'insertOne()', description: 'Insert a new document' },
  update: { label: 'updateOne()', description: 'Update a document' },
  delete: { label: 'deleteOne()', description: 'Delete a document' },
};

const REDIS_OPERATIONS: readonly RedisOperation[] = ['get', 'set', 'del', 'hget', 'hset', 'lpush', 'rpop'];

const REDIS_OPERATION_INFO: Record<RedisOperation, { label: string; description: string }> = {
  get: { label: 'GET', description: 'Get string value' },
  set: { label: 'SET', description: 'Set string value' },
  del: { label: 'DEL', description: 'Delete key' },
  hget: { label: 'HGET', description: 'Get hash field' },
  hset: { label: 'HSET', description: 'Set hash field' },
  lpush: { label: 'LPUSH', description: 'Push to list head' },
  rpop: { label: 'RPOP', description: 'Pop from list tail' },
};

// ============================================
// Main Component
// ============================================

export interface DatabasePanelProps {
  /** Current Database node configuration */
  node: DatabaseNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: DatabaseNodeConfig) => void;
}

/**
 * DatabasePanel provides configuration UI for Database action nodes.
 * 
 * Features:
 * - Database type selector (Requirement 11.1)
 * - Connection configuration with secret handling (Requirement 11.2)
 * - SQL operations UI (Requirement 11.3)
 * - MongoDB operations UI (Requirement 11.4)
 * - Redis operations UI
 * - Standard properties panel integration
 * 
 * @see Requirements 11.1, 11.2, 11.3, 11.4, 12.2
 */
export function DatabasePanel({ node, onChange }: DatabasePanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateDbType = useCallback((dbType: DatabaseType) => {
    // Reset operation configs when changing database type
    const updates: Partial<DatabaseNodeConfig> = { dbType };
    
    // Clear incompatible configs
    if (dbType === 'mongodb') {
      updates.sql = undefined;
      updates.redis = undefined;
      if (!node.mongodb) {
        updates.mongodb = { collection: '', operation: 'find' };
      }
    } else if (dbType === 'redis') {
      updates.sql = undefined;
      updates.mongodb = undefined;
      if (!node.redis) {
        updates.redis = { operation: 'get', key: '' };
      }
    } else {
      // SQL databases
      updates.mongodb = undefined;
      updates.redis = undefined;
      if (!node.sql) {
        updates.sql = { operation: 'query', query: '' };
      }
    }
    
    onChange({ ...node, ...updates });
  }, [node, onChange]);
  
  const updateConnection = useCallback((updates: Partial<DatabaseConnection>) => {
    onChange({
      ...node,
      connection: { ...node.connection, ...updates },
    });
  }, [node, onChange]);
  
  const updateSql = useCallback((updates: Partial<SqlConfig>) => {
    onChange({
      ...node,
      sql: { ...node.sql, ...updates } as SqlConfig,
    });
  }, [node, onChange]);
  
  const updateMongo = useCallback((updates: Partial<MongoConfig>) => {
    onChange({
      ...node,
      mongodb: { ...node.mongodb, ...updates } as MongoConfig,
    });
  }, [node, onChange]);
  
  const updateRedis = useCallback((updates: Partial<RedisConfig>) => {
    onChange({
      ...node,
      redis: { ...node.redis, ...updates } as RedisConfig,
    });
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  const isSqlDatabase = ['postgresql', 'mysql', 'sqlite'].includes(node.dbType);
  
  return (
    <div className="db-panel">
      {/* Database Type Section (Requirement 11.1) */}
      <CollapsibleSection title="Database Type" defaultOpen>
        <Field label="Select Database">
          <div className="db-type-selector">
            {DATABASE_TYPES.map((type) => {
              const info = DATABASE_TYPE_INFO[type];
              return (
                <button
                  key={type}
                  type="button"
                  className={`db-type-option ${node.dbType === type ? 'selected' : ''} db-type-${type}`}
                  onClick={() => updateDbType(type)}
                  title={info.description}
                >
                  <span className="db-type-icon">{info.icon}</span>
                  <span className="db-type-label">{info.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
        
        <div className="db-panel-info">
          <span className="db-panel-info-icon">{DATABASE_TYPE_INFO[node.dbType].icon}</span>
          <span className="db-panel-info-text">{DATABASE_TYPE_INFO[node.dbType].description}</span>
        </div>
      </CollapsibleSection>
      
      {/* Connection Section (Requirement 11.2) */}
      <ConnectionSection 
        connection={node.connection} 
        dbType={node.dbType}
        onChange={updateConnection} 
      />
      
      {/* SQL Operations Section (Requirement 11.3) */}
      {isSqlDatabase && node.sql && (
        <SqlOperationsSection sql={node.sql} onChange={updateSql} />
      )}
      
      {/* MongoDB Operations Section (Requirement 11.4) */}
      {node.dbType === 'mongodb' && node.mongodb && (
        <MongoOperationsSection mongodb={node.mongodb} onChange={updateMongo} />
      )}
      
      {/* Redis Operations Section */}
      {node.dbType === 'redis' && node.redis && (
        <RedisOperationsSection redis={node.redis} onChange={updateRedis} />
      )}
      
      {/* Standard Properties */}
      <StandardPropertiesPanel
        properties={node}
        onChange={updateStandardProperties}
        showIdentity
      />
    </div>
  );
}

// ============================================
// Connection Section Component
// ============================================

interface ConnectionSectionProps {
  connection: DatabaseConnection;
  dbType: DatabaseType;
  onChange: (updates: Partial<DatabaseConnection>) => void;
}

/**
 * Connection configuration section.
 * @see Requirement 11.2
 */
function ConnectionSection({ connection, dbType, onChange }: ConnectionSectionProps) {
  const [showConnectionString, setShowConnectionString] = useState(false);
  
  const getPlaceholder = (): string => {
    switch (dbType) {
      case 'postgresql':
        return 'postgresql://user:password@localhost:5432/database';
      case 'mysql':
        return 'mysql://user:password@localhost:3306/database';
      case 'sqlite':
        return './data/database.sqlite';
      case 'mongodb':
        return 'mongodb://user:password@localhost:27017/database';
      case 'redis':
        return 'redis://localhost:6379';
      default:
        return 'Connection string';
    }
  };
  
  return (
    <CollapsibleSection title="Connection" defaultOpen>
      <Field label="Connection String" required hint="secret - stored securely">
        <div className="db-connection-input-wrapper">
          <input
            type={showConnectionString ? 'text' : 'password'}
            className="db-panel-input db-panel-input-mono"
            value={connection.connectionString}
            onChange={(e) => onChange({ connectionString: e.target.value })}
            placeholder={getPlaceholder()}
          />
          <button
            type="button"
            className="db-connection-toggle"
            onClick={() => setShowConnectionString(!showConnectionString)}
            title={showConnectionString ? 'Hide' : 'Show'}
          >
            {showConnectionString ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        <div className="db-panel-field-help">
          🔒 Connection strings are stored securely and never logged.
        </div>
      </Field>
      
      <Field label="Credential Reference" hint="optional - reference Set node">
        <input
          type="text"
          className="db-panel-input"
          value={connection.credentialRef || ''}
          onChange={(e) => onChange({ credentialRef: e.target.value || undefined })}
          placeholder="set_node_id.DB_CONNECTION"
        />
        <div className="db-panel-field-help">
          Reference credentials from a Set node (e.g., <code>credentials.DB_URL</code>)
        </div>
      </Field>
      
      {dbType !== 'sqlite' && (
        <Field label="Pool Size" hint="connections">
          <input
            type="number"
            className="db-panel-input"
            value={connection.poolSize || 5}
            onChange={(e) => onChange({ poolSize: parseInt(e.target.value, 10) || 5 })}
            min={1}
            max={100}
          />
          <div className="db-panel-field-help">
            Number of connections to maintain in the pool (default: 5)
          </div>
        </Field>
      )}
      
      {/* Connection test button (visual only) */}
      <button type="button" className="db-test-connection-btn" disabled>
        🔌 Test Connection
        <span className="db-test-connection-hint">(available at runtime)</span>
      </button>
    </CollapsibleSection>
  );
}

// ============================================
// SQL Operations Section Component
// ============================================

interface SqlOperationsSectionProps {
  sql: SqlConfig;
  onChange: (updates: Partial<SqlConfig>) => void;
}

/**
 * SQL operations configuration section.
 * @see Requirement 11.3
 */
function SqlOperationsSection({ sql, onChange }: SqlOperationsSectionProps) {
  const [paramsJson, setParamsJson] = useState(
    sql.params ? JSON.stringify(sql.params, null, 2) : '{}'
  );
  const [paramsError, setParamsError] = useState<string | null>(null);
  
  const handleOperationChange = (operation: SqlOperation) => {
    onChange({ 
      operation,
      query: SQL_OPERATION_INFO[operation].template,
    });
  };
  
  const handleParamsChange = (value: string) => {
    setParamsJson(value);
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value);
        setParamsError(null);
        onChange({ params: parsed });
      } else {
        setParamsError(null);
        onChange({ params: undefined });
      }
    } catch {
      setParamsError('Invalid JSON');
    }
  };
  
  return (
    <CollapsibleSection title="SQL Operation" defaultOpen>
      <Field label="Operation Type">
        <div className="db-operation-selector">
          {SQL_OPERATIONS.map((op) => {
            const info = SQL_OPERATION_INFO[op];
            return (
              <button
                key={op}
                type="button"
                className={`db-operation-option ${sql.operation === op ? 'selected' : ''}`}
                onClick={() => handleOperationChange(op)}
                title={info.description}
              >
                {info.label}
              </button>
            );
          })}
        </div>
      </Field>
      
      <Field label="SQL Query" required hint="parameterized with $1, $2, etc.">
        <textarea
          className="db-panel-textarea db-panel-textarea-mono"
          value={sql.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder={SQL_OPERATION_INFO[sql.operation].template}
          rows={6}
        />
        <div className="db-panel-field-help">
          Use <code>$1</code>, <code>$2</code>, etc. for parameterized queries to prevent SQL injection.
        </div>
      </Field>
      
      <Field label="Query Parameters" hint="JSON object">
        <textarea
          className={`db-panel-textarea db-panel-textarea-mono ${paramsError ? 'error' : ''}`}
          value={paramsJson}
          onChange={(e) => handleParamsChange(e.target.value)}
          placeholder='{"$1": "value1", "$2": 123}'
          rows={4}
        />
        {paramsError && <span className="db-panel-error">{paramsError}</span>}
        <div className="db-panel-field-help">
          Map parameter placeholders to values. Supports <code>{'{{variable}}'}</code> interpolation.
        </div>
      </Field>
    </CollapsibleSection>
  );
}

// ============================================
// MongoDB Operations Section Component
// ============================================

interface MongoOperationsSectionProps {
  mongodb: MongoConfig;
  onChange: (updates: Partial<MongoConfig>) => void;
}

/**
 * MongoDB operations configuration section.
 * @see Requirement 11.4
 */
function MongoOperationsSection({ mongodb, onChange }: MongoOperationsSectionProps) {
  const [filterJson, setFilterJson] = useState(
    mongodb.filter ? JSON.stringify(mongodb.filter, null, 2) : '{}'
  );
  const [filterError, setFilterError] = useState<string | null>(null);
  
  const [documentJson, setDocumentJson] = useState(
    mongodb.document ? JSON.stringify(mongodb.document, null, 2) : '{}'
  );
  const [documentError, setDocumentError] = useState<string | null>(null);
  
  const handleFilterChange = (value: string) => {
    setFilterJson(value);
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value);
        setFilterError(null);
        onChange({ filter: parsed });
      } else {
        setFilterError(null);
        onChange({ filter: undefined });
      }
    } catch {
      setFilterError('Invalid JSON');
    }
  };
  
  const handleDocumentChange = (value: string) => {
    setDocumentJson(value);
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value);
        setDocumentError(null);
        onChange({ document: parsed });
      } else {
        setDocumentError(null);
        onChange({ document: undefined });
      }
    } catch {
      setDocumentError('Invalid JSON');
    }
  };
  
  const showFilter = ['find', 'findOne', 'update', 'delete'].includes(mongodb.operation);
  const showDocument = ['insert', 'update'].includes(mongodb.operation);
  
  return (
    <CollapsibleSection title="MongoDB Operation" defaultOpen>
      <Field label="Collection" required>
        <input
          type="text"
          className="db-panel-input"
          value={mongodb.collection}
          onChange={(e) => onChange({ collection: e.target.value })}
          placeholder="users"
        />
      </Field>
      
      <Field label="Operation">
        <div className="db-operation-selector">
          {MONGO_OPERATIONS.map((op) => {
            const info = MONGO_OPERATION_INFO[op];
            return (
              <button
                key={op}
                type="button"
                className={`db-operation-option ${mongodb.operation === op ? 'selected' : ''}`}
                onClick={() => onChange({ operation: op })}
                title={info.description}
              >
                {info.label}
              </button>
            );
          })}
        </div>
      </Field>
      
      {showFilter && (
        <Field label="Filter" hint="MongoDB query">
          <textarea
            className={`db-panel-textarea db-panel-textarea-mono ${filterError ? 'error' : ''}`}
            value={filterJson}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder='{"status": "active", "age": {"$gte": 18}}'
            rows={4}
          />
          {filterError && <span className="db-panel-error">{filterError}</span>}
        </Field>
      )}
      
      {showDocument && (
        <Field label="Document" hint="document to insert/update">
          <textarea
            className={`db-panel-textarea db-panel-textarea-mono ${documentError ? 'error' : ''}`}
            value={documentJson}
            onChange={(e) => handleDocumentChange(e.target.value)}
            placeholder='{"name": "{{input.name}}", "email": "{{input.email}}"}'
            rows={4}
          />
          {documentError && <span className="db-panel-error">{documentError}</span>}
        </Field>
      )}
    </CollapsibleSection>
  );
}

// ============================================
// Redis Operations Section Component
// ============================================

interface RedisOperationsSectionProps {
  redis: RedisConfig;
  onChange: (updates: Partial<RedisConfig>) => void;
}

/**
 * Redis operations configuration section.
 */
function RedisOperationsSection({ redis, onChange }: RedisOperationsSectionProps) {
  const [valueJson, setValueJson] = useState(
    redis.value !== undefined ? JSON.stringify(redis.value, null, 2) : ''
  );
  const [valueError, setValueError] = useState<string | null>(null);
  
  const handleValueChange = (value: string) => {
    setValueJson(value);
    if (!value.trim()) {
      setValueError(null);
      onChange({ value: undefined });
      return;
    }
    
    // Try to parse as JSON, otherwise use as string
    try {
      const parsed = JSON.parse(value);
      setValueError(null);
      onChange({ value: parsed });
    } catch {
      // Use as plain string
      setValueError(null);
      onChange({ value: value });
    }
  };
  
  const showValue = ['set', 'hset', 'lpush'].includes(redis.operation);
  const showTtl = ['set', 'hset'].includes(redis.operation);
  const isHashOp = ['hget', 'hset'].includes(redis.operation);
  
  return (
    <CollapsibleSection title="Redis Operation" defaultOpen>
      <Field label="Operation">
        <div className="db-operation-selector db-operation-selector-wrap">
          {REDIS_OPERATIONS.map((op) => {
            const info = REDIS_OPERATION_INFO[op];
            return (
              <button
                key={op}
                type="button"
                className={`db-operation-option ${redis.operation === op ? 'selected' : ''}`}
                onClick={() => onChange({ operation: op })}
                title={info.description}
              >
                {info.label}
              </button>
            );
          })}
        </div>
      </Field>
      
      <Field label="Key" required>
        <input
          type="text"
          className="db-panel-input db-panel-input-mono"
          value={redis.key}
          onChange={(e) => onChange({ key: e.target.value })}
          placeholder={isHashOp ? 'hash_name:field' : 'cache:user:123'}
        />
        {isHashOp && (
          <div className="db-panel-field-help">
            For hash operations, use format: <code>hash_name:field</code>
          </div>
        )}
      </Field>
      
      {showValue && (
        <Field label="Value" hint="string or JSON">
          <textarea
            className={`db-panel-textarea db-panel-textarea-mono ${valueError ? 'error' : ''}`}
            value={valueJson}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder='{"data": "{{input.data}}"}'
            rows={3}
          />
          {valueError && <span className="db-panel-error">{valueError}</span>}
        </Field>
      )}
      
      {showTtl && (
        <Field label="TTL" hint="seconds, 0 = no expiry">
          <input
            type="number"
            className="db-panel-input"
            value={redis.ttl || 0}
            onChange={(e) => onChange({ ttl: parseInt(e.target.value, 10) || undefined })}
            min={0}
            placeholder="3600"
          />
        </Field>
      )}
    </CollapsibleSection>
  );
}

export default DatabasePanel;
