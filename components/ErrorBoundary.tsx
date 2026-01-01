'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Prevents white screen of death on production
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-semibold text-[#0B3D2E] mb-3">
              Something went wrong
            </h2>
            <p className="text-[#0B3D2E]/70 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            {/* Error Details (Dev Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-[#0B3D2E]/60 hover:text-[#0B3D2E] mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 p-4 bg-red-50 rounded-lg text-xs text-red-900 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-[#0B3D2E] text-white rounded-lg hover:bg-[#0a3629] transition-colors"
              >
                Refresh Page
              </button>
              <a
                href="/unlearn"
                className="px-6 py-2.5 border-2 border-[#0B3D2E] text-[#0B3D2E] rounded-lg hover:bg-[#FAF6EF] transition-colors"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
