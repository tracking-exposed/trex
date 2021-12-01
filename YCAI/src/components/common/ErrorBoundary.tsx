import { ErrorBox } from './ErrorBox';
import * as React from 'react';

interface ErrorState {
  error?: Error;
}

export class ErrorBoundary extends React.PureComponent<any, ErrorState> {
  state: ErrorState;

  constructor(props: any) {
    super(props);
    this.state = { error: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  // componentDidCatch(error: Error, errorInfo: any): void {

  // }

  public render(): React.ReactNode {
    if (this.state.error !== undefined) {
      // You can render any custom fallback UI
      return ErrorBox(this.state.error);
    }
    return this.props.children;
  }
}
