import { ThemeProvider } from '@material-ui/core/styles';
import React from 'react';
import ReactDOM from 'react-dom';
import { theme } from '../theme';
import Tooltip from './components/tooltip';

function main(): void {
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Tooltip />
    </ThemeProvider>,
    document.getElementById('yttrex--tooltip')
  );
}

main();
