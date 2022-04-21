import { CssBaseline, ThemeProvider } from '@material-ui/core';
import debug from 'debug';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { App } from './app/App';
import { theme } from './app/theme';

const main = (): void => {
  debug.enable('@trex*');

  ReactDOM.render(
    <React.StrictMode>
      <HashRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </HashRouter>
    </React.StrictMode>,
    document.getElementById('guardoni')
  );
};

main();
