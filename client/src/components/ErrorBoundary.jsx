import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faRedoAlt } from '@fortawesome/free-solid-svg-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("Neural Sink Error Caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 mb-8 border border-rose-100 shadow-xl shadow-rose-100/50">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Neural Link Severed.</h2>
          <p className="text-slate-500 font-medium max-w-sm mb-10 leading-relaxed">
            The target interface encountered a synchronization failure. Our diagnostic protocol has been initiated.
          </p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl transition-all shadow-xl text-[10px] uppercase tracking-widest active:scale-95"
            >
              <FontAwesomeIcon icon={faRedoAlt} />
              Retry Core Sync
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-5 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest"
            >
              Return to Nexus
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left w-full overflow-hidden">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Diagnostic Trace</p>
               <pre className="text-xs text-rose-500 font-mono overflow-x-auto">
                 {this.state.error && this.state.error.toString()}
               </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
