import { ThemeProvider } from '@material-ui/core/styles';
import ReactDOM from 'react-dom';
import * as React from 'react';
import { YCAITheme } from '../../theme';
import Popup from './components/popup';

bo.runtime.sendMessage(
  {
    type: 'localLookup',
    payload: {
      userId: 'local', // config.userId
    },
  },
  (ucfg: any): void => {
    // const publicKey =
    //   ucfg !== undefined && t.string.is(ucfg.publicKey)
    //     ? ucfg.publicKey
    //     : 'missingPublicKey';
  }
);

const Index: React.FC = () => {
  return (
    <div style={{ width: 400, height: 500 }}>
      <ThemeProvider theme={YCAITheme}>
        <Popup />
      </ThemeProvider>
    </div>
  );
};

ReactDOM.render(<Index />, document.getElementById('main'));
