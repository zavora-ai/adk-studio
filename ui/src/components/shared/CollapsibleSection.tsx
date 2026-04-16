/**
 * Shared CollapsibleSection Component
 *
 * A reusable expandable/collapsible content section for use in all
 * ActionPanel components and other panel UIs throughout ADK Studio.
 *
 * Replaces the duplicated local CollapsibleSection implementations
 * that existed in each ActionPanel (HttpPanel, TriggerPanel, SetPanel, etc.).
 *
 * Requirements: 5.1, 5.3, 5.4
 */

import React, { useState } from 'react';
import './CollapsibleSection.css';

export interface CollapsibleSectionProps {
  /** Section header title */
  title: string;
  /** Whether the section starts expanded (defaults to true) */
  defaultOpen?: boolean;
  /** Section content */
  children: React.ReactNode;
}

/**
 * CollapsibleSection renders a panel section with a clickable header
 * that toggles visibility of its children content.
 *
 * @example
 * ```tsx
 * <CollapsibleSection title="Authentication" defaultOpen={false}>
 *   <p>Auth configuration fields here</p>
 * </CollapsibleSection>
 * ```
 *
 * @see Requirements 5.1, 5.3, 5.4
 */
export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <button
        className="collapsible-section-header"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="collapsible-section-toggle">
          {isOpen ? '▼' : '▶'}
        </span>
        <span className="collapsible-section-title">{title}</span>
      </button>
      {isOpen && (
        <div className="collapsible-section-content">{children}</div>
      )}
    </div>
  );
}

export default CollapsibleSection;
