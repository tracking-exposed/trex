/* eslint-disable */

import React from 'react';
import ReactDOM from 'react-dom';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import db from '../db';
import Tooltip from './components/tooltip';

/* this lives in the content script */
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
    ReactDOM.render(
        <ThemeProvider theme={theme}>
            <Tooltip config={config} />
        </ThemeProvider>, document.getElementById('yttrex--tooltip')
    );
}

main();
