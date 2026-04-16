/**
 * FilePanel Component for ADK Studio
 * 
 * Properties panel for configuring File action nodes.
 * Provides UI for file operations, local/cloud storage configuration,
 * file parsing options, and write settings.
 * 
 * Requirements: 16.1, 16.2, 16.3, 12.2
 */

import { useCallback, useState } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  FileNodeConfig,
  FileOperation,
  FileFormat,
  CloudProvider,
  LocalFileConfig,
  CloudStorageConfig,
  FileParseConfig,
  CsvOptions,
  FileWriteConfig,
  FileListConfig,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/filePanel.css';

// ============================================
// Constants
// ============================================

const FILE_OPERATIONS: readonly FileOperation[] = ['read', 'write', 'delete', 'list'];

const FILE_OPERATION_LABELS: Record<FileOperation, string> = {
  read: '📖 Read',
  write: '✏️ Write',
  delete: '🗑️ Delete',
  list: '📋 List',
};

const FILE_OPERATION_DESCRIPTIONS: Record<FileOperation, string> = {
  read: 'Read file content from local or cloud storage',
  write: 'Write content to a file',
  delete: 'Delete a file from storage',
  list: 'List files in a directory',
};

const FILE_FORMATS: readonly FileFormat[] = ['json', 'csv', 'xml', 'text', 'binary'];

const FILE_FORMAT_LABELS: Record<FileFormat, string> = {
  json: 'JSON',
  csv: 'CSV',
  xml: 'XML',
  text: 'Plain Text',
  binary: 'Binary',
};

const CLOUD_PROVIDERS: readonly CloudProvider[] = ['s3', 'gcs', 'azure'];

const CLOUD_PROVIDER_LABELS: Record<CloudProvider, string> = {
  s3: 'Amazon S3',
  gcs: 'Google Cloud Storage',
  azure: 'Azure Blob Storage',
};

const DEFAULT_LOCAL_CONFIG: LocalFileConfig = {
  path: '',
  encoding: 'utf-8',
};

const DEFAULT_CLOUD_CONFIG: CloudStorageConfig = {
  provider: 's3',
  bucket: '',
  key: '',
  credentials: '',
};

const DEFAULT_PARSE_CONFIG: FileParseConfig = {
  format: 'text',
};

const DEFAULT_CSV_OPTIONS: CsvOptions = {
  delimiter: ',',
  hasHeader: true,
  quoteChar: '"',
};

const DEFAULT_WRITE_CONFIG: FileWriteConfig = {
  content: '',
  createDirs: true,
  append: false,
};

const DEFAULT_LIST_CONFIG: FileListConfig = {
  path: '',
  recursive: false,
};

// ============================================
// Main Component
// ============================================

export interface FilePanelProps {
  /** Current File node configuration */
  node: FileNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: FileNodeConfig) => void;
}

/**
 * FilePanel provides configuration UI for File action nodes.
 * 
 * Features:
 * - Operation selector (read/write/delete/list) (Requirement 16.1)
 * - Local file path configuration (Requirement 16.1)
 * - Cloud storage configuration (S3/GCS/Azure) (Requirement 16.3)
 * - File parsing options (JSON/CSV/XML/text) (Requirement 16.2)
 * - CSV-specific options (delimiter, header) (Requirement 16.2)
 * - Write options (content, append, create dirs)
 * - List options (recursive, pattern)
 * - Standard properties panel integration
 * 
 * @see Requirements 16.1, 16.2, 16.3, 12.2
 */
export function FilePanel({ node, onChange }: FilePanelProps) {
  const [storageType, setStorageType] = useState<'local' | 'cloud'>(
    node.cloud ? 'cloud' : 'local'
  );
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateOperation = useCallback((operation: FileOperation) => {
    const updates: Partial<FileNodeConfig> = { operation };
    
    // Initialize appropriate config based on operation
    if (operation === 'read' && !node.parse) {
      updates.parse = { ...DEFAULT_PARSE_CONFIG };
    } else if (operation === 'write' && !node.write) {
      updates.write = { ...DEFAULT_WRITE_CONFIG };
    } else if (operation === 'list' && !node.list) {
      updates.list = { ...DEFAULT_LIST_CONFIG };
    }
    
    onChange({ ...node, ...updates });
  }, [node, onChange]);
  
  const updateStorageType = useCallback((type: 'local' | 'cloud') => {
    setStorageType(type);
    
    if (type === 'local') {
      onChange({
        ...node,
        local: node.local || { ...DEFAULT_LOCAL_CONFIG },
        cloud: undefined,
      });
    } else {
      onChange({
        ...node,
        cloud: node.cloud || { ...DEFAULT_CLOUD_CONFIG },
        local: undefined,
      });
    }
  }, [node, onChange]);
  
  const updateLocal = useCallback((updates: Partial<LocalFileConfig>) => {
    onChange({
      ...node,
      local: { ...(node.local || DEFAULT_LOCAL_CONFIG), ...updates },
    });
  }, [node, onChange]);
  
  const updateCloud = useCallback((updates: Partial<CloudStorageConfig>) => {
    onChange({
      ...node,
      cloud: { ...(node.cloud || DEFAULT_CLOUD_CONFIG), ...updates },
    });
  }, [node, onChange]);
  
  const updateParse = useCallback((updates: Partial<FileParseConfig>) => {
    onChange({
      ...node,
      parse: { ...(node.parse || DEFAULT_PARSE_CONFIG), ...updates },
    });
  }, [node, onChange]);
  
  const updateCsvOptions = useCallback((updates: Partial<CsvOptions>) => {
    onChange({
      ...node,
      parse: {
        ...(node.parse || DEFAULT_PARSE_CONFIG),
        csvOptions: { ...(node.parse?.csvOptions || DEFAULT_CSV_OPTIONS), ...updates },
      },
    });
  }, [node, onChange]);
  
  const updateWrite = useCallback((updates: Partial<FileWriteConfig>) => {
    onChange({
      ...node,
      write: { ...(node.write || DEFAULT_WRITE_CONFIG), ...updates },
    });
  }, [node, onChange]);
  
  const updateList = useCallback((updates: Partial<FileListConfig>) => {
    onChange({
      ...node,
      list: { ...(node.list || DEFAULT_LIST_CONFIG), ...updates },
    });
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="file-panel">
      {/* Operation Selection */}
      <CollapsibleSection title="File Operation" defaultOpen>
        <Field label="Operation" required tooltip="Select the file operation to perform">
          <div className="file-operation-selector">
            {FILE_OPERATIONS.map((op) => (
              <button
                key={op}
                type="button"
                className={`file-operation-option ${node.operation === op ? 'selected' : ''}`}
                onClick={() => updateOperation(op)}
                title={FILE_OPERATION_DESCRIPTIONS[op]}
              >
                {FILE_OPERATION_LABELS[op]}
              </button>
            ))}
          </div>
        </Field>
        <div className="file-panel-operation-description">
          {FILE_OPERATION_DESCRIPTIONS[node.operation]}
        </div>
      </CollapsibleSection>
      
      {/* Storage Type Selection */}
      <CollapsibleSection title="Storage Location" defaultOpen>
        <Field label="Storage Type" required tooltip="Choose local file system or cloud storage">
          <div className="file-storage-selector">
            <button
              type="button"
              className={`file-storage-option ${storageType === 'local' ? 'selected' : ''}`}
              onClick={() => updateStorageType('local')}
            >
              💾 Local
            </button>
            <button
              type="button"
              className={`file-storage-option ${storageType === 'cloud' ? 'selected' : ''}`}
              onClick={() => updateStorageType('cloud')}
            >
              ☁️ Cloud
            </button>
          </div>
        </Field>
        
        {/* Local File Configuration */}
        {storageType === 'local' && (
          <LocalFileSection 
            local={node.local} 
            onChange={updateLocal}
            operation={node.operation}
          />
        )}
        
        {/* Cloud Storage Configuration */}
        {storageType === 'cloud' && (
          <CloudStorageSection 
            cloud={node.cloud} 
            onChange={updateCloud} 
          />
        )}
      </CollapsibleSection>
      
      {/* File Parsing Options (for read operation) */}
      {node.operation === 'read' && (
        <ParseOptionsSection 
          parse={node.parse}
          onChange={updateParse}
          onCsvChange={updateCsvOptions}
        />
      )}
      
      {/* Write Options (for write operation) */}
      {node.operation === 'write' && (
        <WriteOptionsSection 
          write={node.write}
          onChange={updateWrite}
        />
      )}
      
      {/* List Options (for list operation) */}
      {node.operation === 'list' && (
        <ListOptionsSection 
          list={node.list}
          onChange={updateList}
        />
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
// Local File Section Component (Requirement 16.1)
// ============================================

interface LocalFileSectionProps {
  local?: LocalFileConfig;
  onChange: (updates: Partial<LocalFileConfig>) => void;
  operation: FileOperation;
}

function LocalFileSection({ local, onChange, operation }: LocalFileSectionProps) {
  const config = local || DEFAULT_LOCAL_CONFIG;
  
  return (
    <div className="file-local-section">
      <Field 
        label={operation === 'list' ? 'Directory Path' : 'File Path'} 
        required 
        hint="supports {{variable}}"
        tooltip={operation === 'list' 
          ? 'Path to the directory to list' 
          : 'Path to the file (absolute or relative)'
        }
      >
        <input
          type="text"
          className="file-panel-input"
          value={config.path}
          onChange={(e) => onChange({ path: e.target.value })}
          placeholder={operation === 'list' ? '/path/to/directory' : '/path/to/file.txt'}
        />
      </Field>
      
      {operation !== 'list' && operation !== 'delete' && (
        <Field label="Encoding" tooltip="File encoding (default: utf-8)">
          <select
            className="file-panel-select"
            value={config.encoding || 'utf-8'}
            onChange={(e) => onChange({ encoding: e.target.value })}
          >
            <option value="utf-8">UTF-8</option>
            <option value="ascii">ASCII</option>
            <option value="latin1">Latin-1</option>
            <option value="utf-16">UTF-16</option>
          </select>
        </Field>
      )}
    </div>
  );
}

// ============================================
// Cloud Storage Section Component (Requirement 16.3)
// ============================================

interface CloudStorageSectionProps {
  cloud?: CloudStorageConfig;
  onChange: (updates: Partial<CloudStorageConfig>) => void;
}

function CloudStorageSection({ cloud, onChange }: CloudStorageSectionProps) {
  const config = cloud || DEFAULT_CLOUD_CONFIG;
  
  return (
    <div className="file-cloud-section">
      <Field label="Provider" required tooltip="Cloud storage provider">
        <select
          className="file-panel-select"
          value={config.provider}
          onChange={(e) => onChange({ provider: e.target.value as CloudProvider })}
        >
          {CLOUD_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {CLOUD_PROVIDER_LABELS[provider]}
            </option>
          ))}
        </select>
      </Field>
      
      <Field label="Bucket" required hint="container name" tooltip="S3 bucket, GCS bucket, or Azure container name">
        <input
          type="text"
          className="file-panel-input"
          value={config.bucket}
          onChange={(e) => onChange({ bucket: e.target.value })}
          placeholder="my-bucket"
        />
      </Field>
      
      <Field label="Key" required hint="object path" tooltip="Object key/path within the bucket">
        <input
          type="text"
          className="file-panel-input"
          value={config.key}
          onChange={(e) => onChange({ key: e.target.value })}
          placeholder="path/to/file.txt"
        />
      </Field>
      
      <Field 
        label="Credentials" 
        required 
        hint="state key or {{variable}}"
        tooltip="Reference to credentials in state (from Set node) or environment variable"
      >
        <input
          type="text"
          className="file-panel-input"
          value={config.credentials}
          onChange={(e) => onChange({ credentials: e.target.value })}
          placeholder="{{AWS_CREDENTIALS}} or state.cloudCreds"
        />
      </Field>
      
      {config.provider === 's3' && (
        <Field label="Region" tooltip="AWS region for S3 bucket">
          <input
            type="text"
            className="file-panel-input"
            value={config.region || ''}
            onChange={(e) => onChange({ region: e.target.value || undefined })}
            placeholder="us-east-1"
          />
        </Field>
      )}
      
      <div className="file-panel-row">
        <Field label="Generate Presigned URL" tooltip="Generate a presigned URL for the object">
          <label className="file-panel-toggle">
            <input
              type="checkbox"
              checked={config.presignedUrl || false}
              onChange={(e) => onChange({ presignedUrl: e.target.checked })}
            />
            <span className="file-panel-toggle-slider" />
            <span className="file-panel-toggle-label">
              {config.presignedUrl ? 'Yes' : 'No'}
            </span>
          </label>
        </Field>
        
        {config.presignedUrl && (
          <Field label="Expiry" hint="seconds">
            <input
              type="number"
              className="file-panel-input file-panel-input-small"
              value={config.presignedExpiry || 3600}
              onChange={(e) => onChange({ presignedExpiry: parseInt(e.target.value, 10) || 3600 })}
              min={60}
              max={604800}
            />
          </Field>
        )}
      </div>
    </div>
  );
}

// ============================================
// Parse Options Section Component (Requirement 16.2)
// ============================================

interface ParseOptionsSectionProps {
  parse?: FileParseConfig;
  onChange: (updates: Partial<FileParseConfig>) => void;
  onCsvChange: (updates: Partial<CsvOptions>) => void;
}

function ParseOptionsSection({ parse, onChange, onCsvChange }: ParseOptionsSectionProps) {
  const config = parse || DEFAULT_PARSE_CONFIG;
  const csvOptions = config.csvOptions || DEFAULT_CSV_OPTIONS;
  
  return (
    <CollapsibleSection title="Parsing Options" defaultOpen>
      <Field label="File Format" required tooltip="Format to parse the file content as">
        <div className="file-format-selector">
          {FILE_FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              className={`file-format-option ${config.format === format ? 'selected' : ''}`}
              onClick={() => onChange({ format })}
            >
              {FILE_FORMAT_LABELS[format]}
            </button>
          ))}
        </div>
      </Field>
      
      {/* CSV-specific options */}
      {config.format === 'csv' && (
        <div className="file-csv-options">
          <div className="file-panel-row">
            <Field label="Delimiter" tooltip="Field separator character">
              <select
                className="file-panel-select file-panel-select-small"
                value={csvOptions.delimiter}
                onChange={(e) => onCsvChange({ delimiter: e.target.value })}
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </Field>
            
            <Field label="Has Header Row">
              <label className="file-panel-toggle">
                <input
                  type="checkbox"
                  checked={csvOptions.hasHeader}
                  onChange={(e) => onCsvChange({ hasHeader: e.target.checked })}
                />
                <span className="file-panel-toggle-slider" />
                <span className="file-panel-toggle-label">
                  {csvOptions.hasHeader ? 'Yes' : 'No'}
                </span>
              </label>
            </Field>
          </div>
          
          <div className="file-panel-row">
            <Field label="Quote Character" tooltip="Character used to quote fields">
              <input
                type="text"
                className="file-panel-input file-panel-input-small"
                value={csvOptions.quoteChar || '"'}
                onChange={(e) => onCsvChange({ quoteChar: e.target.value || '"' })}
                maxLength={1}
              />
            </Field>
            
            <Field label="Escape Character" tooltip="Character used to escape quotes">
              <input
                type="text"
                className="file-panel-input file-panel-input-small"
                value={csvOptions.escapeChar || ''}
                onChange={(e) => onCsvChange({ escapeChar: e.target.value || undefined })}
                maxLength={1}
                placeholder="\\"
              />
            </Field>
          </div>
        </div>
      )}
      
      {/* XML-specific options */}
      {config.format === 'xml' && (
        <Field label="Root Element" tooltip="XML root element to extract (optional)">
          <input
            type="text"
            className="file-panel-input"
            value={config.xmlRootElement || ''}
            onChange={(e) => onChange({ xmlRootElement: e.target.value || undefined })}
            placeholder="data"
          />
        </Field>
      )}
    </CollapsibleSection>
  );
}

// ============================================
// Write Options Section Component (Requirement 16.1)
// ============================================

interface WriteOptionsSectionProps {
  write?: FileWriteConfig;
  onChange: (updates: Partial<FileWriteConfig>) => void;
}

function WriteOptionsSection({ write, onChange }: WriteOptionsSectionProps) {
  const config = write || DEFAULT_WRITE_CONFIG;
  
  return (
    <CollapsibleSection title="Write Options" defaultOpen>
      <Field 
        label="Content" 
        required 
        hint="state key or expression"
        tooltip="Content to write to the file. Can be a state key or expression."
      >
        <textarea
          className="file-panel-textarea"
          value={config.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="{{state.data}} or literal content"
          rows={4}
        />
      </Field>
      
      <div className="file-panel-row">
        <Field label="Create Directories" tooltip="Create parent directories if they don't exist">
          <label className="file-panel-toggle">
            <input
              type="checkbox"
              checked={config.createDirs}
              onChange={(e) => onChange({ createDirs: e.target.checked })}
            />
            <span className="file-panel-toggle-slider" />
            <span className="file-panel-toggle-label">
              {config.createDirs ? 'Yes' : 'No'}
            </span>
          </label>
        </Field>
        
        <Field label="Append Mode" tooltip="Append to file instead of overwriting">
          <label className="file-panel-toggle">
            <input
              type="checkbox"
              checked={config.append || false}
              onChange={(e) => onChange({ append: e.target.checked })}
            />
            <span className="file-panel-toggle-slider" />
            <span className="file-panel-toggle-label">
              {config.append ? 'Yes' : 'No'}
            </span>
          </label>
        </Field>
      </div>
    </CollapsibleSection>
  );
}

// ============================================
// List Options Section Component (Requirement 16.1)
// ============================================

interface ListOptionsSectionProps {
  list?: FileListConfig;
  onChange: (updates: Partial<FileListConfig>) => void;
}

function ListOptionsSection({ list, onChange }: ListOptionsSectionProps) {
  const config = list || DEFAULT_LIST_CONFIG;
  
  return (
    <CollapsibleSection title="List Options" defaultOpen>
      <Field label="Recursive" tooltip="Include files from subdirectories">
        <label className="file-panel-toggle">
          <input
            type="checkbox"
            checked={config.recursive || false}
            onChange={(e) => onChange({ recursive: e.target.checked })}
          />
          <span className="file-panel-toggle-slider" />
          <span className="file-panel-toggle-label">
            {config.recursive ? 'Yes' : 'No'}
          </span>
        </label>
      </Field>
      
      <Field 
        label="Pattern Filter" 
        hint="glob pattern"
        tooltip="Filter files by pattern (e.g., *.txt, data_*.csv)"
      >
        <input
          type="text"
          className="file-panel-input"
          value={config.pattern || ''}
          onChange={(e) => onChange({ pattern: e.target.value || undefined })}
          placeholder="*.txt"
        />
      </Field>
    </CollapsibleSection>
  );
}

export default FilePanel;
