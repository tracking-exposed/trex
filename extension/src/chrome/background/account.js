import nacl from 'tweetnacl';
import bs58 from 'bs58';

import api from '../api';
import { isEmpty } from '../../utils';
import db from '../db';
import config from '../../config';

const bo = chrome || browser;
const FIXED_USER_NAME = 'local';

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'localLookup') {
        userLookup( request.payload ? request.payload : { userId: FIXED_USER_NAME }, sendResponse);
        return true;
    }
    if (request.type === 'remoteLookup') {
        serverLookup(request.payload, sendResponse);
        return true;
    }
    if (request.type === 'configUpdate') {
        configUpdate(request.payload, sendResponse);
        return true;
    }
});

function initializeKey() {
    var newKeypair = nacl.sign.keyPair();
    return {
        publicKey: bs58.encode(newKeypair.publicKey),
        secretKey: bs58.encode(newKeypair.secretKey)
    };
}

function userLookup ({ userId }, sendResponse) {

    db.get(userId).then(val => {
        if (isEmpty(val)) {
            var val = initializeKey();
            db.set(userId, val).then(val => {
                sendResponse(val);
            });
        } else {
            console.log("sending back these keys from localstorage", _.keys(val));
            sendResponse(val);
        }
    });
};

function serverLookup (payload, sendResponse) {

    /* remoteLookup might be call as first function after the extension has been
     * installed, and the keys not be yet instanciated */
    const userId = FIXED_USER_NAME;
    db.get(userId).then(val => {
        if (isEmpty(val)) {
            var val = initializeKey();
            db.set(userId, val);
        }
        return val;
    })
    .then(function (x) {
        return api
            .handshake(payload, 'local')
            .then(response => sendResponse({type: 'handshakeResponse', response: response}))
            .catch(error => sendResponse({type: 'handshakeError', response: error}));
    });
};

function configUpdate (payload, sendResponse) {

    const userId = FIXED_USER_NAME;
    db.get(userId).then(val => {
        console.log("current status is", JSON.stringify(val, undefined, 2), payload);
        _.each(payload, function(value, key) {
            console.log("Updating", key, value);
            _.set(val, key, value);
            _.set(config, key, value);
        })
        return db.set(userId, val);
    }).then(val => {
        sendResponse(val);
    })
}