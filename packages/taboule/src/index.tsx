import { createTheme, ThemeProvider } from '@material-ui/core';
import { ErrorBoundary } from '@shared/components/Error/ErrorBoundary';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TabouleIndex, TabouleIndexProps } from './components';
import { TabouleQueries } from './state/queries';

interface DataTableProps<Q extends keyof TabouleQueries>
  extends TabouleIndexProps<Q> {
  node: HTMLDivElement;
}

let lastQueries: string[] = [];

const appendTo = <Q extends keyof TabouleQueries>({
  node,
  queries,
  ...props
}: DataTableProps<Q>): void => {
  const theme = createTheme();

  if (queries?.some((q) => lastQueries.includes(q.value))) {
    ReactDOM.unmountComponentAtNode(node);
  }

  lastQueries = queries?.map((q) => q.value) ?? [];

  ReactDOM.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <TabouleIndex {...props} queries={queries} />
        </ErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>,
    node
  );
};

export default appendTo;
