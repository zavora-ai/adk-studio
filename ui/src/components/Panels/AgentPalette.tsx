import { DragEvent } from 'react';

const AGENT_TYPES = [
  { type: 'llm', label: 'LLM Agent', color: '#3182CE' },
  { type: 'sequential', label: 'Sequential Agent', color: '#805AD5' },
  { type: 'loop', label: 'Loop Agent', color: '#D69E2E' },
  { type: 'parallel', label: 'Parallel Agent', color: '#38A169' },
  { type: 'router', label: 'Router Agent', color: '#DD6B20' },
];

interface Props {
  onDragStart: (e: DragEvent, type: string) => void;
  onCreate: (type: string) => void;
}

export function AgentPalette({ onDragStart, onCreate }: Props) {
  return (
    <div>
      <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Agents</h3>
      <div className="space-y-1">
        {AGENT_TYPES.map(({ type, label, color }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            onClick={() => onCreate(type)}
            className="p-1.5 rounded text-xs cursor-grab hover:opacity-80 text-white font-medium"
            style={{ backgroundColor: color }}
          >
            ⊕ {label}
          </div>
        ))}
      </div>
    </div>
  );
}
