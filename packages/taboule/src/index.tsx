import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ThemeProvider, Box, Typography, createTheme } from '@material-ui/core';
import { Taboule, TabouleProps } from './components/Taboule';
import { TabouleQueries } from './state/queries';
import { ErrorBoundary } from '@shared/components/Error/ErrorBoundary';

interface DataTableProps<Q extends keyof TabouleQueries>
  extends TabouleProps<Q> {
  node: HTMLDivElement;
}

let lastQuery: undefined | string = undefined;

const appendTo = <Q extends keyof TabouleQueries>({
  node,
  ...props
}: DataTableProps<Q>): void => {
  const theme = createTheme();

  if (lastQuery && lastQuery !== props.query) {
    console.log('unmount component at node', node);
    ReactDOM.unmountComponentAtNode(node);
  }

  lastQuery = props.query;

  ReactDOM.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <Box>
          <ErrorBoundary>
            <Taboule {...props} />
          </ErrorBoundary>
          <Box>
            <Typography>v{process.env.VERSION}</Typography>
          </Box>
        </Box>
      </ThemeProvider>
    </React.StrictMode>,
    node
  );
};

export default appendTo;
