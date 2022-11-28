import { Box } from '@material-ui/core';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { APIInterceptedSnackbar } from './APIInterceptedSnackbar';
import { SigiStateSnackbar } from './SigiStateSnackbar';

export const addAppUI = (node: Element): void => {
  if (document.body.contains(node)) {
    ReactDOM.unmountComponentAtNode(node);
  }

  node.id = 'tktrex-app-ui';

  document.body.append(node);

  ReactDOM.render(
    <React.Fragment>
      <Box style={{ position: 'fixed' }}>
        <APIInterceptedSnackbar />
        <SigiStateSnackbar />
      </Box>
    </React.Fragment>,
    node,
  );
};
