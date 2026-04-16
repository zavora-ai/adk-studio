import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary that catches render errors and displays
 * a recovery UI instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ADK Studio caught an error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#1a1a2e',
          color: '#e0e0e0',
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#f87171' }}>Something went wrong</h2>
          <p style={{ marginBottom: '1.5rem', maxWidth: '500px', color: '#a0a0b0' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0F8A8A',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Reload ADK Studio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
