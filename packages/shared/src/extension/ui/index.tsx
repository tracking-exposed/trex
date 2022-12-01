import { Box, ThemeProvider } from '@material-ui/core';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Hub } from '../hub';
import HubEvent from '../models/HubEvent';
import { theme } from '../theme';
import { ErrorSnackbars } from './ErrorSnackbars';

/**
 * Render a ReactNode in a container created by the given id
 *
 * @param id The container id
 * @param children the ReactNode to render in the container
 */
export const addPageUI = (id: string, children: React.ReactNode): void => {
  const nodeId = `#${id}`;
  let node = window.document.querySelector(nodeId);
  if (node && document.body.contains(node)) {
    ReactDOM.unmountComponentAtNode(node);
  }

  node = node ?? document.createElement('div');
  node.id = id;

  document.body.append(node);

  ReactDOM.render(
    <React.Fragment>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </React.Fragment>,
    node
  );
};

interface CommonPageUIOptions {
  errors?: boolean;
}

/**
 * Add the common UI (error handler) to the page dom
 *
 * @param id The container node id
 * @param hub The instance of the {@link Hub}
 * @param opts The common ui options {@link CommonPageUIOptions}
 */
export const addCommonPageUI = (
  id: string,
  hub: Hub<HubEvent>,
  opts: CommonPageUIOptions
): void => {
  addPageUI(id, <Box>{opts.errors ? <ErrorSnackbars hub={hub} /> : null}</Box>);
};
