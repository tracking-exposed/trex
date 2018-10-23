import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import db from '../db';
import Popup from './components/popup';

const bo = chrome || browser;

function main () {

     bo.runtime.sendMessage({
        type: 'localLookup',
        payload: {
            userId: 'local' // config.userId
        }
     }, ucfg => {
        const publicKey = ucfg ? ucfg.publicKey : 'missingPublicKey';
        ReactDOM.render(
            <MuiThemeProvider>
                <Popup publicKey={publicKey} />
            </MuiThemeProvider>,
            document.getElementById('main')
        )
    });
}

main();
