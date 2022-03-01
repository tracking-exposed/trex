import { ThemeProvider } from '@material-ui/core/styles';
import debug from 'debug';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { Popup } from './components/popup/Popup';
import { config } from './config';
import { YCAITheme } from './theme';

import './i18n';
import './resources/global.css';

const Index: React.FC = () => {
  debug.enable(config.DEBUG);

  return (
    <ThemeProvider theme={YCAITheme}>
      <Popup />
    </ThemeProvider>
  );
};

ReactDOM.render(<Index />, document.getElementById('ycai'));
