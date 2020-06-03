import React from 'react';
import ReactDOM from 'react-dom';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import db from '../db';
import Popup from './components/popup';

const bo = chrome || browser;

const Zimplon = {
    fontFamily: 'Trex-Regular',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    fontWeight: 400,
    src: `
        local('Trex-Regular'),
        url('Trex-Regular.ttf') format('ttf')
    `,
    unicodeRange:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF',
};

const theme = createMuiTheme({
    typography: {
        fontFamily: 'Trex-Regular'
    },
    overrides: {
        MuiCssBaseline: {
            '@global': {
                '@font-face': [Zimplon],
            },
        },
    },
});

function main () {
    bo.runtime.sendMessage({
        type: 'localLookup',
        payload: {
            userId: 'local' // config.userId
        }
    }, ucfg => {
        const publicKey = (ucfg && _.isString(ucfg.publicKey) ) ? ucfg.publicKey : 'missingPublicKey';
        ReactDOM.render(
            <ThemeProvider theme={theme}>
                <Popup publicKey={publicKey} />
            </ThemeProvider>, document.getElementById('main')
        );
    });
}

main();