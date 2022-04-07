import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { App } from './app/App';
import { theme } from './app/theme';
import debug from 'debug';
import { BrowserRouter } from 'react-router-dom';

const main = (): void => {
  debug.enable('@trex*');

  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('guardoni')
  );
};

main();
