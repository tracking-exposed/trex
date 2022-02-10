import { createTheme, ThemeProvider } from '@material-ui/core';
import { ErrorBoundary } from '@trex/shared/components/Error/ErrorBoundary';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Taboule, TabouleProps } from './components/Taboule';
import { TabouleQueries } from './state/queries';

interface DataTableProps<Q extends keyof TabouleQueries>
  extends TabouleProps<Q> {
  node: HTMLDivElement;
}

let lastQuery: undefined | string;

const appendTo = <Q extends keyof TabouleQueries>({
  node,
  ...props
}: DataTableProps<Q>): void => {
  const theme = createTheme();

  if (lastQuery && lastQuery !== props.query) {
    ReactDOM.unmountComponentAtNode(node);
  }

  lastQuery = props.query;

  ReactDOM.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <Taboule {...props} />
        </ErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>,
    node
  );
};

export default appendTo;
