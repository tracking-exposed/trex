import React from 'react';
import ReactDOM from 'react-dom';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import db from '../db';
import Popup from './components/popup';

function main () {
    console.log("xx543534x");
    console.log("xxx");
    db
        .get("whatever")
        .then(val =>
            ReactDOM.render(
                <MuiThemeProvider>
                    <Popup/>
                </MuiThemeProvider>,
                document.getElementById('main')
            )
        );
}

main();
