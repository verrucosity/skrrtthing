import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render crashes so the app shows a recoverable message instead of
 * going blank. Without this, any uncaught exception anywhere in the tree
 * unmounts the whole UI with no indication anything went wrong.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Render crash caught by ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
          <p className="text-lg font-semibold text-zinc-100">Something went wrong.</p>
          <p className="max-w-md text-sm text-zinc-400">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
