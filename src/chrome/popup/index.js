import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import db from '../db';
import Popup from './components/popup';

const bo = chrome || browser;

function main () {
    bo.cookies.get({
        url: 'https://www.youtube.com/',
        name: 'VISITOR_INFO1_LIVE'
    }, cookie => {
        const cookieId = cookie ? cookie.value : 'missingCookie';
        ReactDOM.render(
            <MuiThemeProvider>
                <Popup cookieId={cookieId} />
            </MuiThemeProvider>,
            document.getElementById('main')
        )
    });
}

main();
