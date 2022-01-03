import * as React from 'react';

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
      return (
        <div>
          <h1>Un error occurred: {this.state.error.name}</h1>
          <pre style={{ backgroundColor: 'white' }}>
            <code>{JSON.stringify(this.state.error, null, 2)}</code>
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
