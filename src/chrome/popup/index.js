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
        const userId = cookie.value;
        db.get(userId).then(val =>
            ReactDOM.render(
                <MuiThemeProvider>
                    <Popup
                        userId={userId}
                        publicKey={val.publicKey} />
                </MuiThemeProvider>,
                document.getElementById('main'))
        );
    });
}

main();
