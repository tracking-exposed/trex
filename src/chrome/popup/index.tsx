// @ts-ignore
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@material-ui/core/styles';
import Popup from './components/popup';
import { YCAITheme } from '../../theme';
import { bo } from './utils';
import * as t from 'io-ts';

function Main() {
  bo.runtime.sendMessage(
    {
      type: 'localLookup',
      payload: {
        userId: 'local', // config.userId
      },
    },
    (ucfg: any): void => {
      const publicKey =
        ucfg && t.string.is(ucfg.publicKey)
          ? ucfg.publicKey
          : 'missingPublicKey';
      ReactDOM.render(
        <div style={{ width: 400, height: 500 }}>
          <ThemeProvider theme={YCAITheme}>
            <Popup publicKey={publicKey} />
          </ThemeProvider>
        </div>,
        document.getElementById('main')
      );
    }
  );
}

Main();
