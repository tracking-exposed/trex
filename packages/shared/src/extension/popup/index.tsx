import '../../../public/font.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import Popup, { PopupProps } from './components/Popup';

// define @mui theme for popup
const theme = createTheme({
  typography: {
    fontFamily: 'Trex-Regular',
  },
});

/**
 * This function is responsible to render the extension popup in the proper DOM node.
 *
 * Each extension has to use this by giving platform specific configuration
 */
export function renderPopup(props: PopupProps): void {
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Popup {...props} />
    </ThemeProvider>,
    document.getElementById('main')
  );
}
