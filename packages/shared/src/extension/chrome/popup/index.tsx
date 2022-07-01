import '../../../../public/font.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import Popup, { PopupProps } from './components/popup';

const theme = createTheme({
  typography: {
    fontFamily: 'Trex-Regular',
  },
});

export function main(props: PopupProps): void {
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Popup {...props} />
    </ThemeProvider>,
    document.getElementById('main')
  );
}
