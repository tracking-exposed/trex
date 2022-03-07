import '../../../../public/font.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import Popup from './components/popup';

const theme = createTheme({
  typography: {
    fontFamily: 'Trex-Regular',
  },
});

export function main(): void {
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Popup />
    </ThemeProvider>,
    document.getElementById('main')
  );
}
