import { Component, type ErrorInfo, type ReactNode } from 'react';

type FallbackRender = (retry: () => void) => ReactNode;

interface ErrorBoundaryProps {
    children: ReactNode;
    /**
     * Either a static fallback node, or a render function receiving a `retry`
     * callback that resets the boundary so the lazy import is re-attempted.
     */
    fallback?: ReactNode | FallbackRender;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

/**
 * Catches render/lazy-import failures in its subtree so a rejected dynamic
 * import (e.g. a missing chunk in the Capacitor WebView, Pitfall 1) does not
 * blank the whole screen. The default fallback offers a "retry" affordance
 * that clears the error state and re-mounts the children, re-triggering the
 * lazy import.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] subtree failed to render/load:', error, info.componentStack);
    }

    retry = () => this.setState({ hasError: false });

    render() {
        if (this.state.hasError) {
            const { fallback } = this.props;
            if (typeof fallback === 'function') {
                return (fallback as FallbackRender)(this.retry);
            }
            if (fallback !== undefined) {
                return fallback;
            }
            // Generic non-translated safety net (call sites pass a translated fallback).
            return (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <p className="text-slate-600">Something went wrong.</p>
                    <button
                        onClick={this.retry}
                        className="px-4 py-2 rounded-lg bg-sky-500 text-white font-medium"
                    >
                        Retry
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
