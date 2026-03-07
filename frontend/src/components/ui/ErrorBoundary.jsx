import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-surface-main flex items-center justify-center p-6">
                    <div className="max-w-md w-full glass rounded-[2.5rem] p-10 text-center space-y-8 animate-fade-in shadow-2xl shadow-red-500/5 border-red-500/10">
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-text-primary tracking-tight">System Interruption</h2>
                            <p className="text-text-secondary font-medium leading-relaxed">
                                We've encountered an unexpected issue while rendering this view. Our team has been notified.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleReset}
                                className="w-full btn-premium-accent bg-red-500 hover:bg-red-600 shadow-red-500/20 flex items-center justify-center space-x-3 group"
                            >
                                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                                <span>Recover Application</span>
                            </button>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-6">
                                Reference Code: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
