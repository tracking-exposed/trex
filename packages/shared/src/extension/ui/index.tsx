import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import React from 'react';
import ReactDOM from 'react-dom';
// import Tooltip from './components/tooltip';
import { ErrorBoundary } from '../../components/Error/ErrorBoundary';
import { ParserConfiguration, ParserFn } from '../../providers/parser.provider';
import { Hub } from '../hub';
import {
  MetadataLogger,
  MetadataLoggerProps
} from './components/MetadataLogger';

const theme = createTheme({
  typography: {
    fontFamily: 'Trex-Regular',
  },
});

// const TOOLTIP_ID = 'trex--tooltip';
const METADATA_LOGGER_ID = 'trex--metadata-logger';

export interface RenderUIProps<
  S,
  M,
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<S, any, C>>
> {
  hub: Hub<any>;
  metadataLogger: Omit<MetadataLoggerProps<S, M, C, PP>, 'hub'>;
}

export function renderUI<
  S,
  M,
  C extends ParserConfiguration,
  PP extends Record<string, ParserFn<S, any, C>>
>({ hub, metadataLogger }: RenderUIProps<S, M, C, PP>): void {
  // const tooltipNode = document.getElementById(TOOLTIP_ID);
  // if (!tooltipNode) {
  //   const node = document.createElement('div');

  //   node.id = TOOLTIP_ID;
  //   document.body.append(node);
  //   ReactDOM.render(
  //     <ThemeProvider theme={theme}>
  //       <Tooltip />
  //     </ThemeProvider>,
  //     node
  //   );
  // }

  const metadataLoggerNode = document.getElementById(METADATA_LOGGER_ID);
  if (!metadataLoggerNode) {
    const node = document.createElement('div');

    node.id = METADATA_LOGGER_ID;
    document.body.append(node);
    ReactDOM.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <ErrorBoundary>
            <MetadataLogger hub={hub} {...metadataLogger} />
          </ErrorBoundary>
        </ThemeProvider>
      </React.StrictMode>,
      node
    );
  }
}
