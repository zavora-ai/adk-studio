/**
 * FileNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for File action nodes.
 * Displays operation badge (read/write/delete/list), path preview,
 * and storage type indicator (local/cloud).
 * 
 * Requirements: 16.1, 16.2, 16.3, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { FileNodeConfig, FileOperation, CloudProvider } from '../../types/actionNodes';

interface FileNodeData extends FileNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: FileNodeData;
  selected?: boolean;
}

/**
 * File operation icons and labels for visual distinction.
 */
const FILE_OPERATION_CONFIG: Record<FileOperation, { icon: string; label: string; color: string }> = {
  read: { icon: '📖', label: 'Read', color: '#3B82F6' },     // Blue - reading
  write: { icon: '✏️', label: 'Write', color: '#10B981' },   // Green - writing
  delete: { icon: '🗑️', label: 'Delete', color: '#EF4444' }, // Red - deleting
  list: { icon: '📋', label: 'List', color: '#8B5CF6' },     // Purple - listing
};

/**
 * Cloud provider icons and labels.
 */
const CLOUD_PROVIDER_CONFIG: Record<CloudProvider, { icon: string; label: string }> = {
  s3: { icon: '☁️', label: 'S3' },
  gcs: { icon: '☁️', label: 'GCS' },
  azure: { icon: '☁️', label: 'Azure' },
};

/**
 * Truncates path for display.
 */
function truncatePath(path: string, maxLength: number = 35): string {
  if (!path || path.length <= maxLength) return path;
  
  // Try to show the filename at the end
  const lastSlash = path.lastIndexOf('/');
  const lastBackslash = path.lastIndexOf('\\');
  const lastSep = Math.max(lastSlash, lastBackslash);
  
  if (lastSep > 0) {
    const filename = path.substring(lastSep + 1);
    const dir = path.substring(0, lastSep);
    
    if (filename.length < maxLength - 5) {
      const availableForDir = maxLength - filename.length - 4;
      if (availableForDir > 3) {
        return dir.substring(0, availableForDir) + '.../' + filename;
      }
    }
  }
  
  return path.substring(0, maxLength - 3) + '...';
}

/**
 * Gets the display path from the node configuration.
 */
function getDisplayPath(data: FileNodeData): string | undefined {
  if (data.cloud) {
    return `${data.cloud.bucket}/${data.cloud.key}`;
  }
  if (data.local) {
    return data.local.path;
  }
  if (data.list) {
    return data.list.path;
  }
  return undefined;
}

/**
 * FileNode displays file operation configuration.
 * 
 * Features:
 * - Operation badge (read/write/delete/list) with distinct colors (Requirement 16.1)
 * - Path preview (local or cloud)
 * - Storage type indicator (local/S3/GCS/Azure)
 * - File format indicator for read operations (Requirement 16.2)
 * - Cloud provider badge (Requirement 16.3)
 * 
 * @see Requirements 16.1, 16.2, 16.3, 12.1, 12.3
 */
export const FileNode = memo(function FileNode({ data, selected }: Props) {
  const operationConfig = FILE_OPERATION_CONFIG[data.operation] || FILE_OPERATION_CONFIG.read;
  const displayPath = getDisplayPath(data);
  const isCloud = !!data.cloud;
  const cloudConfig = data.cloud ? CLOUD_PROVIDER_CONFIG[data.cloud.provider] : null;
  
  return (
    <ActionNodeBase
      type="file"
      label={data.name || 'File'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      <div className="file-node-content">
        {/* Operation badge row */}
        <div className="file-operation-row">
          <span 
            className="file-operation-badge"
            style={{ backgroundColor: operationConfig.color }}
          >
            <span className="file-operation-icon">{operationConfig.icon}</span>
            <span className="file-operation-label">{operationConfig.label}</span>
          </span>
          
          {/* Storage type indicator */}
          {isCloud && cloudConfig && (
            <span className="file-cloud-badge" title={`Cloud: ${cloudConfig.label}`}>
              {cloudConfig.icon} {cloudConfig.label}
            </span>
          )}
          {!isCloud && displayPath && (
            <span className="file-local-badge" title="Local file system">
              💾 Local
            </span>
          )}
        </div>
        
        {/* Path preview */}
        {displayPath && (
          <div className="file-path-preview" title={displayPath}>
            <span className="file-path-icon">📂</span>
            <span className="file-path-text">
              {truncatePath(displayPath)}
            </span>
          </div>
        )}
        
        {/* Format indicator for read operations */}
        {data.operation === 'read' && data.parse && (
          <div className="file-format-row">
            <span className="file-format-badge" title={`Format: ${data.parse.format.toUpperCase()}`}>
              {getFormatIcon(data.parse.format)} {data.parse.format.toUpperCase()}
            </span>
            {data.parse.format === 'csv' && data.parse.csvOptions?.hasHeader && (
              <span className="file-option-badge" title="Has header row">
                📊 Headers
              </span>
            )}
          </div>
        )}
        
        {/* Write options indicator */}
        {data.operation === 'write' && data.write && (
          <div className="file-write-row">
            {data.write.append && (
              <span className="file-option-badge" title="Append mode">
                ➕ Append
              </span>
            )}
            {data.write.createDirs && (
              <span className="file-option-badge" title="Create directories">
                📁 Create dirs
              </span>
            )}
          </div>
        )}
        
        {/* List options indicator */}
        {data.operation === 'list' && data.list && (
          <div className="file-list-row">
            {data.list.recursive && (
              <span className="file-option-badge" title="Recursive listing">
                🔄 Recursive
              </span>
            )}
            {data.list.pattern && (
              <span className="file-option-badge" title={`Pattern: ${data.list.pattern}`}>
                🔍 {data.list.pattern.length > 10 
                  ? data.list.pattern.substring(0, 10) + '...' 
                  : data.list.pattern}
              </span>
            )}
          </div>
        )}
        
        {/* Cloud-specific indicators */}
        {isCloud && data.cloud && (
          <div className="file-cloud-row">
            {data.cloud.presignedUrl && (
              <span className="file-option-badge" title="Generate presigned URL">
                🔗 Presigned
              </span>
            )}
            {data.cloud.region && (
              <span className="file-region-badge" title={`Region: ${data.cloud.region}`}>
                🌍 {data.cloud.region}
              </span>
            )}
          </div>
        )}
      </div>
    </ActionNodeBase>
  );
});

/**
 * Gets the icon for a file format.
 */
function getFormatIcon(format: string): string {
  switch (format) {
    case 'json': return '📋';
    case 'csv': return '📊';
    case 'xml': return '📄';
    case 'text': return '📝';
    case 'binary': return '💾';
    default: return '📄';
  }
}

export default FileNode;
