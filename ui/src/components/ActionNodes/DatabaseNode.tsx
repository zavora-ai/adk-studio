/**
 * DatabaseNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for Database action nodes.
 * Displays database type badge, operation indicator, and connection status.
 * 
 * Requirements: 11.1, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { DatabaseNodeConfig, DatabaseType, SqlOperation, MongoOperation, RedisOperation } from '../../types/actionNodes';
import '../../styles/databaseNode.css';

interface DatabaseNodeData extends DatabaseNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: DatabaseNodeData;
  selected?: boolean;
}

/**
 * Database type color mapping for visual distinction.
 */
const DATABASE_TYPE_COLORS: Record<DatabaseType, string> = {
  postgresql: '#336791',  // PostgreSQL blue
  mysql: '#4479A1',       // MySQL blue
  sqlite: '#003B57',      // SQLite dark blue
  mongodb: '#47A248',     // MongoDB green
  redis: '#DC382D',       // Redis red
};

/**
 * Database type icons.
 */
const DATABASE_TYPE_ICONS: Record<DatabaseType, string> = {
  postgresql: '🐘',
  mysql: '🐬',
  sqlite: '📦',
  mongodb: '🍃',
  redis: '⚡',
};

/**
 * Database type display labels.
 */
const DATABASE_TYPE_LABELS: Record<DatabaseType, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  sqlite: 'SQLite',
  mongodb: 'MongoDB',
  redis: 'Redis',
};

/**
 * SQL operation display labels.
 */
const SQL_OPERATION_LABELS: Record<SqlOperation, string> = {
  query: 'SELECT',
  insert: 'INSERT',
  update: 'UPDATE',
  delete: 'DELETE',
  upsert: 'UPSERT',
};

/**
 * MongoDB operation display labels.
 */
const MONGO_OPERATION_LABELS: Record<MongoOperation, string> = {
  find: 'find()',
  findOne: 'findOne()',
  insert: 'insert()',
  update: 'update()',
  delete: 'delete()',
};

/**
 * Redis operation display labels.
 */
const REDIS_OPERATION_LABELS: Record<RedisOperation, string> = {
  get: 'GET',
  set: 'SET',
  del: 'DEL',
  hget: 'HGET',
  hset: 'HSET',
  lpush: 'LPUSH',
  rpop: 'RPOP',
};

/**
 * Gets the current operation label based on database type.
 */
function getOperationLabel(data: DatabaseNodeData): string | null {
  if (data.dbType === 'mongodb' && data.mongodb?.operation) {
    return MONGO_OPERATION_LABELS[data.mongodb.operation];
  }
  if (data.dbType === 'redis' && data.redis?.operation) {
    return REDIS_OPERATION_LABELS[data.redis.operation];
  }
  if (data.sql?.operation) {
    return SQL_OPERATION_LABELS[data.sql.operation];
  }
  return null;
}

/**
 * Gets the target (table/collection/key) based on database type.
 */
function getTarget(data: DatabaseNodeData): string | null {
  if (data.dbType === 'mongodb' && data.mongodb?.collection) {
    return data.mongodb.collection;
  }
  if (data.dbType === 'redis' && data.redis?.key) {
    return truncateText(data.redis.key, 20);
  }
  // For SQL, try to extract table name from query
  if (data.sql?.query) {
    const match = data.sql.query.match(/(?:FROM|INTO|UPDATE)\s+[`"']?(\w+)[`"']?/i);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Truncates text for display.
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Checks if connection is configured.
 */
function hasConnection(data: DatabaseNodeData): boolean {
  return !!(data.connection?.connectionString || data.connection?.credentialRef);
}

/**
 * DatabaseNode displays database operations.
 * 
 * Features:
 * - Database type badge with icon (Requirement 11.1)
 * - Operation indicator (SELECT, INSERT, find(), GET, etc.)
 * - Target display (table/collection/key)
 * - Connection status indicator
 * - Pool size indicator
 * 
 * @see Requirements 11.1, 12.1, 12.3
 */
export const DatabaseNode = memo(function DatabaseNode({ data, selected }: Props) {
  const dbColor = DATABASE_TYPE_COLORS[data.dbType] || '#14B8A6';
  const dbIcon = DATABASE_TYPE_ICONS[data.dbType] || '🗄️';
  const dbLabel = DATABASE_TYPE_LABELS[data.dbType] || data.dbType;
  const operation = getOperationLabel(data);
  const target = getTarget(data);
  const connected = hasConnection(data);
  
  return (
    <ActionNodeBase
      type="database"
      label={data.name || 'Database'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      <div className="database-node-content">
        {/* Database type badge */}
        <div className="database-type-row">
          <span 
            className="database-type-badge"
            style={{ backgroundColor: dbColor }}
            title={dbLabel}
          >
            <span className="database-type-icon">{dbIcon}</span>
            <span className="database-type-label">{dbLabel}</span>
          </span>
          
          {/* Connection status */}
          <span 
            className={`database-connection-status ${connected ? 'connected' : 'disconnected'}`}
            title={connected ? 'Connection configured' : 'No connection configured'}
          >
            {connected ? '🔗' : '⚠️'}
          </span>
        </div>
        
        {/* Operation and target */}
        {operation && (
          <div className="database-operation-row">
            <span className="database-operation-badge">{operation}</span>
            {target && (
              <span className="database-target" title={target}>
                → {target}
              </span>
            )}
          </div>
        )}
        
        {/* Additional indicators */}
        <div className="database-indicators">
          {/* Pool size indicator */}
          {data.connection?.poolSize && data.connection.poolSize > 1 && (
            <span className="database-pool-badge" title={`Pool size: ${data.connection.poolSize}`}>
              🔄 {data.connection.poolSize}
            </span>
          )}
          
          {/* Credential reference indicator */}
          {data.connection?.credentialRef && (
            <span className="database-cred-badge" title={`Using credentials from: ${data.connection.credentialRef}`}>
              🔐 ref
            </span>
          )}
          
          {/* Query params indicator for SQL */}
          {data.sql?.params && Object.keys(data.sql.params).length > 0 && (
            <span className="database-params-badge" title="Has query parameters">
              📋 {Object.keys(data.sql.params).length} params
            </span>
          )}
          
          {/* Filter indicator for MongoDB */}
          {data.mongodb?.filter && Object.keys(data.mongodb.filter).length > 0 && (
            <span className="database-filter-badge" title="Has filter">
              🔍 filter
            </span>
          )}
          
          {/* TTL indicator for Redis */}
          {data.redis?.ttl && (
            <span className="database-ttl-badge" title={`TTL: ${data.redis.ttl}s`}>
              ⏱️ {data.redis.ttl}s
            </span>
          )}
        </div>
      </div>
    </ActionNodeBase>
  );
});

export default DatabaseNode;
