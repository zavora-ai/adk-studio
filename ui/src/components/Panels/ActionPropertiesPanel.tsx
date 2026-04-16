/**
 * ActionPropertiesPanel Component for ADK Studio
 * 
 * Renders the appropriate properties panel based on the selected action node type.
 * This component acts as a router to the specific panel components.
 * 
 * @see Requirements 12.2, 12.3
 */

import { useStore } from '../../store';
import { 
  isTriggerNode, 
  isHttpNode, 
  isSetNode, 
  isTransformNode, 
  isSwitchNode, 
  isLoopNode, 
  isMergeNode, 
  isWaitNode, 
  isCodeNode, 
  isDatabaseNode,
  isEmailNode,
  type ActionNodeConfig,
} from '../../types/actionNodes';

// Import all action node panels
import { TriggerPanel } from '../ActionPanels/TriggerPanel';
import { HttpPanel } from '../ActionPanels/HttpPanel';
import { SetPanel } from '../ActionPanels/SetPanel';
import { TransformPanel } from '../ActionPanels/TransformPanel';
import { SwitchPanel } from '../ActionPanels/SwitchPanel';
import { LoopPanel } from '../ActionPanels/LoopPanel';
import { MergePanel } from '../ActionPanels/MergePanel';
import { WaitPanel } from '../ActionPanels/WaitPanel';
import { CodePanel } from '../ActionPanels/CodePanel';
import { DatabasePanel } from '../ActionPanels/DatabasePanel';
import { EmailPanel } from '../ActionPanels/EmailPanel';

import '../../styles/actionPropertiesPanel.css';

export interface ActionPropertiesPanelProps {
  /** ID of the selected action node */
  nodeId: string;
  /** Callback to close the panel */
  onClose: () => void;
}

/**
 * ActionPropertiesPanel renders the configuration panel for the selected action node.
 * It determines the node type and renders the appropriate panel component.
 */
export function ActionPropertiesPanel({ nodeId, onClose }: ActionPropertiesPanelProps) {
  const { currentProject, updateActionNode, removeActionNode } = useStore();
  
  // Get the action node from the project
  const actionNode = currentProject?.actionNodes?.[nodeId];
  
  if (!actionNode) {
    return (
      <div className="action-properties-panel">
        <div className="action-properties-panel-header">
          <span className="action-properties-panel-title">Action Node</span>
          <button className="action-properties-panel-close" onClick={onClose}>×</button>
        </div>
        <div className="action-properties-panel-empty">
          Node not found
        </div>
      </div>
    );
  }
  
  // Handle node updates
  const handleUpdate = (updates: ActionNodeConfig) => {
    updateActionNode(nodeId, updates);
  };
  
  // Handle node deletion
  const handleDelete = () => {
    removeActionNode(nodeId);
    onClose();
  };
  
  // Get node type label and icon
  const getNodeInfo = () => {
    if (isTriggerNode(actionNode)) return { label: 'Trigger', icon: '🎯', color: '#6366F1' };
    if (isHttpNode(actionNode)) return { label: 'HTTP', icon: '🌐', color: '#3B82F6' };
    if (isSetNode(actionNode)) return { label: 'Set', icon: '📝', color: '#8B5CF6' };
    if (isTransformNode(actionNode)) return { label: 'Transform', icon: '⚙️', color: '#EC4899' };
    if (isSwitchNode(actionNode)) return { label: 'Switch', icon: '🔀', color: '#F59E0B' };
    if (isLoopNode(actionNode)) return { label: 'Loop', icon: '🔄', color: '#10B981' };
    if (isMergeNode(actionNode)) return { label: 'Merge', icon: '🔗', color: '#06B6D4' };
    if (isWaitNode(actionNode)) return { label: 'Wait', icon: '⏱️', color: '#6B7280' };
    if (isCodeNode(actionNode)) return { label: 'Code', icon: '💻', color: '#EF4444' };
    if (isDatabaseNode(actionNode)) return { label: 'Database', icon: '🗄️', color: '#14B8A6' };
    if (isEmailNode(actionNode)) return { label: 'Email', icon: '📧', color: '#EA580C' };
    return { label: 'Action', icon: '⚡', color: '#6B7280' };
  };
  
  const nodeInfo = getNodeInfo();
  
  // Render the appropriate panel based on node type
  const renderPanel = () => {
    if (isTriggerNode(actionNode)) {
      return <TriggerPanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isHttpNode(actionNode)) {
      return <HttpPanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isSetNode(actionNode)) {
      return <SetPanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isTransformNode(actionNode)) {
      return <TransformPanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isSwitchNode(actionNode)) {
      return <SwitchPanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isLoopNode(actionNode)) {
      return <LoopPanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isMergeNode(actionNode)) {
      return <MergePanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isWaitNode(actionNode)) {
      return <WaitPanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isCodeNode(actionNode)) {
      return <CodePanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isDatabaseNode(actionNode)) {
      return <DatabasePanel node={actionNode} onChange={handleUpdate} />;
    }
    if (isEmailNode(actionNode)) {
      return <EmailPanel node={actionNode} onChange={handleUpdate} />;
    }
    
    return (
      <div className="action-properties-panel-empty">
        Unknown node type
      </div>
    );
  };
  
  return (
    <div className="action-properties-panel">
      <div className="action-properties-panel-header">
        <div className="action-properties-panel-title-row">
          <span 
            className="action-properties-panel-icon"
            style={{ backgroundColor: nodeInfo.color }}
          >
            {nodeInfo.icon}
          </span>
          <span className="action-properties-panel-title">{nodeInfo.label}</span>
          <span className="action-properties-panel-id">{nodeId}</span>
        </div>
        <div className="action-properties-panel-actions">
          <button 
            className="action-properties-panel-delete" 
            onClick={handleDelete}
            title="Delete node"
          >
            🗑️
          </button>
          <button 
            className="action-properties-panel-close" 
            onClick={onClose}
            title="Close panel"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="action-properties-panel-content">
        {renderPanel()}
      </div>
    </div>
  );
}

export default ActionPropertiesPanel;
