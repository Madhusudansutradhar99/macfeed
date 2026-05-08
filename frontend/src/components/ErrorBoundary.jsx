import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-primary text-primary">
          <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-secondary/40 backdrop-blur-xl p-6 md:p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-primary">Something broke</h2>
            <p className="mt-3 text-sm text-secondary leading-relaxed">
              This section crashed, but the rest of the site is still usable. You can retry this view or go back home.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.25em]"
              >
                <RefreshCcw className="w-4 h-4" />
                Retry
              </button>
              <button
                type="button"
                onClick={() => window.location.hash = '#/'}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 bg-white/10 text-primary border border-white/10 font-black uppercase text-[10px] tracking-[0.25em]"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}