/**
 * Shared Field Component
 *
 * A reusable form field wrapper with label, optional hint, required indicator,
 * and tooltip support. Used across all ActionPanel components and other panel
 * UIs throughout ADK Studio.
 *
 * Replaces the duplicated local Field implementations that existed in each
 * ActionPanel (HttpPanel, TriggerPanel, SetPanel, CodePanel, etc.).
 *
 * Requirements: 5.1
 */

import React from 'react';
import { Tooltip } from '../Overlays/Tooltip';
import './Field.css';

export interface FieldProps {
  /** Field label text */
  label: string;
  /** Optional hint text displayed in parentheses after the label */
  hint?: string;
  /** Whether the field is required (shows a red asterisk) */
  required?: boolean;
  /** Optional tooltip text shown on hover via the Tooltip component */
  tooltip?: string;
  /** Field content (inputs, selects, etc.) */
  children: React.ReactNode;
}

/**
 * Field renders a form field wrapper with a label row and content area.
 *
 * The label row can include:
 * - The label text
 * - A required asterisk indicator
 * - A hint in parentheses
 * - A tooltip info icon that shows a tooltip on hover
 *
 * @example
 * ```tsx
 * <Field label="URL" required hint="supports variables">
 *   <input type="text" value={url} onChange={handleChange} />
 * </Field>
 *
 * <Field label="Method" tooltip="HTTP method to use for the request">
 *   <select value={method} onChange={handleChange}>
 *     <option>GET</option>
 *     <option>POST</option>
 *   </select>
 * </Field>
 * ```
 *
 * @see Requirements 5.1
 */
export function Field({ label, hint, required, tooltip, children }: FieldProps) {
  const labelContent = (
    <label className="shared-field-label">
      {label}
      {required && <span className="shared-field-required">*</span>}
      {hint && <span className="shared-field-hint">({hint})</span>}
      {tooltip && (
        <span className="shared-field-tooltip-icon" title={tooltip}>
          ℹ️
        </span>
      )}
    </label>
  );

  return (
    <div className="shared-field">
      {tooltip ? (
        <Tooltip content={tooltip} position="right" delay={300}>
          {labelContent}
        </Tooltip>
      ) : (
        labelContent
      )}
      {children}
    </div>
  );
}

export default Field;
