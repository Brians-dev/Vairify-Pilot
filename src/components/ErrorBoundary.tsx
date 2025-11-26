import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("❌ Error caught by boundary:", error);
    console.error("Error info:", errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'system-ui',
          backgroundColor: '#ffffff',
          color: '#000000'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#dc2626' }}>
              ⚠️ Application Error
            </h1>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
              An error occurred while loading the application:
            </p>
            {this.state.error && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <p style={{ fontFamily: 'monospace', fontSize: '14px', color: '#991b1b', wordBreak: 'break-word' }}>
                  <strong>Error:</strong> {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre style={{
                    fontSize: '12px',
                    color: '#7f1d1d',
                    overflow: 'auto',
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            {this.state.errorInfo && (
              <details style={{ marginBottom: '16px' }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280', marginBottom: '8px' }}>
                  Component Stack
                </summary>
                <pre style={{
                  fontSize: '12px',
                  backgroundColor: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

