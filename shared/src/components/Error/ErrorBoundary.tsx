import * as React from 'react';
import { ErrorBox } from './ErrorBox';

interface ErrorState {
  error?: Error;
}

export class ErrorBoundary extends React.Component<any, ErrorState> {
  state: ErrorState;

  constructor(props: any, context: any) {
    super(props, context);
    this.state = { error: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    // eslint-disable-next-line no-console
    console.log('derivederror', error);
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: any): void {
    // eslint-disable-next-line no-console
    console.log('error catched', { error, errorInfo });
    this.setState({ error });
  }

  public render(): React.ReactNode {
    if (this.state.error !== undefined) {
      // You can render any custom fallback UI
      // eslint-disable-next-line no-console
      return ErrorBox(this.state.error);
    }
    return this.props.children;
  }
}
