/**
 * TemplateWalkthroughModal component for ADK Studio v2.0
 * 
 * Provides a guided walkthrough experience after loading a template.
 * Guides users through: environment setup, understanding nodes, customization, and running.
 * 
 * Requirements: Task 35 - n8n-Inspired Workflow Templates
 */

import { X, ChevronRight, ChevronLeft, Check, Sparkles, ExternalLink, Settings, Play } from 'lucide-react';
import { useTemplateWalkthrough } from '../../hooks/useTemplateWalkthrough';

interface TemplateWalkthroughModalProps {
  /** Callback when an action button is clicked */
  onAction?: (actionType: string, templateId: string) => void;
}

/**
 * Template walkthrough modal for post-template-load guidance
 */
export function TemplateWalkthroughModal({ onAction }: TemplateWalkthroughModalProps) {
  const {
    template,
    steps,
    currentStep,
    isVisible,
    next,
    previous,
    goToStep,
    skip,
    complete,
  } = useTemplateWalkthrough();

  if (!isVisible || !template || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      complete();
    } else {
      next();
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      previous();
    }
  };

  const handleAction = () => {
    if (step.action && onAction) {
      onAction(step.action.type, template.id);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'open-env':
        return <Settings size={14} />;
      case 'open-docs':
        return <ExternalLink size={14} />;
      case 'run-workflow':
        return <Play size={14} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={skip}
    >
      <div 
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--surface-panel)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4"
          style={{ 
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={20} />
            <span className="font-semibold">Template Guide</span>
          </div>
          <button
            onClick={skip}
            className="p-1 rounded hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress indicator - clickable steps */}
        <div 
          className="flex gap-1 px-6 py-3"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {steps.map((s, index) => (
            <button
              key={s.id}
              onClick={() => goToStep(index)}
              className="flex-1 h-2 rounded-full transition-all hover:opacity-80"
              style={{
                backgroundColor: index <= currentStep 
                  ? 'var(--accent-primary)' 
                  : 'var(--border-default)',
                cursor: 'pointer',
              }}
              title={s.title}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Step icon and title */}
          <div className="text-center mb-6">
            <span className="text-5xl mb-4 block">{step.icon}</span>
            <h2 
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {step.title}
            </h2>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {step.description}
            </p>
          </div>

          {/* Tips */}
          <div 
            className="rounded-lg p-4 mb-4"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <ul className="space-y-2">
              {step.tips.map((tip, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Check 
                    size={16} 
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: 'var(--accent-primary)' }}
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action button (if step has one) */}
          {step.action && (
            <div className="mb-4">
              <button
                onClick={handleAction}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--accent-primary)',
                }}
              >
                {getActionIcon(step.action.type)}
                {step.action.label}
              </button>
            </div>
          )}

          {/* Step counter */}
          <div 
            className="text-center text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Footer with navigation */}
        <div 
          className="flex items-center justify-between px-6 py-4"
          style={{ 
            borderTop: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <button
            onClick={skip}
            className="px-4 py-2 text-sm rounded transition-colors hover:bg-opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            Skip Guide
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-1 px-4 py-2 text-sm rounded transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded transition-colors"
              style={{ 
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
              }}
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
