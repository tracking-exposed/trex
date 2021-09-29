import { ThemeProvider } from '@material-ui/core/styles';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { YCAITheme } from './theme';
import { Popup } from './components/popup/Popup';

const Index: React.FC = () => {
  return (
    <ThemeProvider theme={YCAITheme}>
      <Popup />
    </ThemeProvider>
  );
};

ReactDOM.render(<Index />, document.getElementById('main'));
