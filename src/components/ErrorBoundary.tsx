import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });

    // Handle dynamic import / chunk loading failures after new deployments
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('dynamically imported module') ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('Importing a module script failed')
    ) {
      const reloadKey = 'vrg_chunk_auto_reload_ts';
      const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
      const now = Date.now();
      // Reload once within a 30-second window to fetch fresh asset chunks
      if (now - lastReload > 30000) {
        sessionStorage.setItem(reloadKey, String(now));
        console.warn('[ErrorBoundary] Stale chunk detected. Refreshing page to get latest version...');
        window.location.reload();
      }
    }
  }

  private handleResetCacheAndReload = () => {
    try {
      // Clear potentially corrupt local cache keys while keeping critical state
      const keysToClear = [
        'vrg_products',
        'vrg_categories',
        'vrg_banners',
        'vrg_reviews',
        'vrg_combos_cache',
        'vrg_deleted_combos',
        'vrg_deleted_products',
        'vrg_deleted_reviews',
        'vrg_admin_persisted_cache',
        'vrg_catalog_sync_ver',
        'vrg_splash_shown'
      ];
      keysToClear.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
        try { sessionStorage.removeItem(k); } catch {}
      });
    } catch {}

    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #fef2f2 100%)',
          padding: '20px',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          color: '#1e293b'
        }}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            background: '#ffffff',
            borderRadius: 20,
            padding: '32px 24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            {/* Header Icon */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fef2f2',
              border: '2px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#dc2626'
            }}>
              <AlertTriangle style={{ width: 32, height: 32 }} />
            </div>

            {/* Title & Description */}
            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 8px',
              lineHeight: 1.2
            }}>
              Oops! Something went wrong
            </h2>
            <p style={{
              fontSize: 14,
              color: '#64748b',
              margin: '0 0 24px',
              lineHeight: 1.5
            }}>
              We encountered a temporary display issue. Click below to refresh or restore standard view.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <RefreshCw style={{ width: 16, height: 16 }} /> Refresh Page
              </button>

              <button
                onClick={this.handleResetCacheAndReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 20px',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: 14,
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <RotateCcw style={{ width: 16, height: 16 }} /> Reset Cache & Go to Home
              </button>
            </div>

            {/* Collapsible Error Debug Details */}
            {this.state.error && (
              <details style={{
                marginTop: 24,
                textAlign: 'left',
                background: '#f8fafc',
                borderRadius: 8,
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                fontSize: 11,
                color: '#64748b'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#94a3b8' }}>
                  Technical Details
                </summary>
                <pre style={{
                  marginTop: 8,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  color: '#ef4444'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
