import nacl from 'tweetnacl';
import bs58 from 'bs58';

import api from '../api';
import { isEmpty } from '../../utils';
import db from '../db';

const bo = chrome || browser;

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'localLookup') {
        userLookup(request.payload, sendResponse);
        return true;
    } 
    if (request.type === 'remoteLookup') {
        serverLookup(request.payload, sendResponse);
        return true;
    }
});

function userLookup ({ userId }, sendResponse) {
    userId = 'local';
    db.get(userId).then(val => {
        if (isEmpty(val)) {
            var newKeypair = nacl.sign.keyPair();
            val = {
                publicKey: bs58.encode(newKeypair.publicKey),
                secretKey: bs58.encode(newKeypair.secretKey),
            };
            db.set(userId, val).then(val => {
                sendResponse({ publicKey: val.publicKey, status: val.status });
            });
        } else {
            sendResponse({ publicKey: val.publicKey, status: val.status });
        }
    });
};


function serverLookup (payload, sendResponse) {

    /* remoteLookup might be call as first function after the extension has been
     * installed, and the keys not be yet instanciated */
    const userId = 'local';
    db.get(userId).then(val => {
        if (isEmpty(val)) {
            var newKeypair = nacl.sign.keyPair();
            val = {
                publicKey: bs58.encode(newKeypair.publicKey),
                secretKey: bs58.encode(newKeypair.secretKey),
            };
            db.set(userId, val);
        }
        return val;
    })
    .then(function(x) {
        return api
            .handshake(payload, 'local')
            .then(response => sendResponse({type: 'handshakeResponse', response: response}))
            .catch(error => sendResponse({type: 'handshakeError', response: error}));
    });
};

