import nacl from 'tweetnacl';
import bs58 from 'bs58';

import api from '../api';
import { isEmpty } from '../../utils';
import db from '../db';

const bo = chrome || browser;

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'userLookup') {
        userLookup(request.payload, sendResponse);

        // Make the call asynchronous.
        return true;
    } else if (request.type === 'optIn') {
        updateSettings(request.payload, sendResponse);

        // Make the call asynchronous.
        return true;
    }
});

function userLookup ({ userId }, sendResponse) {
    db.get(userId).then(val => {
        if (isEmpty(val)) {
            var newKeypair = nacl.sign.keyPair();
            val = {
                publicKey: bs58.encode(newKeypair.publicKey),
                secretKey: bs58.encode(newKeypair.secretKey),
                status: 'new'
            };
            db.set(userId, val).then(val => {
                sendResponse({ publicKey: val.publicKey, status: val.status });
            });
        } else {
            sendResponse({ publicKey: val.publicKey, status: val.status, optin: val.optin });
        }
    });
};

function updateSettings ({ infoDiet, dataReuse, userId }, sendResponse) {
    db.get(userId).then(val => {
        Object.assign(val, { status: 'accepted', optin: { infoDiet: infoDiet, dataReuse: dataReuse }});
        db.update(userId, val)
            .then(response => sendResponse('ok', response))
            .catch(response => sendResponse('error', response));
    });
};
