import React from 'react';
import ReactDOM from 'react-dom';

import { createTheme, ThemeProvider } from '@material-ui/core/styles';

import '../../../public/font.css';
import Popup from './components/popup';

const theme = createTheme({
  typography: {
    fontFamily: 'Trex-Regular',
  },
});

function main(): void {
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Popup />
    </ThemeProvider>,
    document.getElementById('main'),
  );
}

main();
