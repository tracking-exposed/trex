import React from 'react';
import ReactDOM from 'react-dom';

import { createTheme, ThemeProvider } from '@material-ui/core/styles';

import Tooltip from './components/tooltip';

const theme = createTheme({
  typography: {
    fontFamily: 'Trex-Regular',
  },
});

function main(): void {
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Tooltip />
    </ThemeProvider>,
    document.getElementById('yttrex--tooltip'),
  );
}

main();
