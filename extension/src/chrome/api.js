import nacl from 'tweetnacl';
import bs58 from 'bs58';

import config from '../config';
import { decodeString, decodeKey } from '../utils';
import db from './db';

function post (apiUrl, data, cookieId) {
    return new Promise((resolve, reject) => {
        db.get('local').then(keypair => {
            const xhr = new XMLHttpRequest();
            const payload = JSON.stringify(data);
            const url = config.API_ROOT + apiUrl;

            xhr.open('POST', url, true);

            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-YTtrex-Version', config.VERSION);
            xhr.setRequestHeader('X-YTtrex-Build', config.BUILD);

            if (!keypair) {
                reject('Cannot sign payload, no keypair found!');
                return;
            }

            const signature = nacl.sign.detached(decodeString(payload),
                                                 decodeKey(keypair.secretKey));

            xhr.setRequestHeader('X-YTtrex-NonAuthCookieId', cookieId);
            xhr.setRequestHeader('X-YTtrex-PublicKey', keypair.publicKey);
            xhr.setRequestHeader('X-YTtrex-Signature', bs58.encode(signature));

            xhr.send(payload);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(this.response);
                } else {
                    reject(this.statusText);
                }
            };

            xhr.onerror = function () {
                reject(this.statusText);
            };
        })
        .catch(error => reject(error));
    });
}

function get(apiUrl, version, userId) {
    return new Promise((resolve, reject) => {
        db.get('local').then(keypair => {
            const xhr = new XMLHttpRequest();
            const url = config.API_ROOT + apiUrl;

            xhr.open('GET', url, true);

            xhr.setRequestHeader('X-YTtrex-Version', version);
            xhr.send();
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    console.log(this.response);
                    resolve(this.response);
                } else {
                    console.log("Load error", this.statusText);
                    reject(this.statusText);
                }
            };

            xhr.onerror = function () {
                console.log("onerror", this.statusText);
                reject(this.statusText);
            };
        })
        .catch(error => reject(error));
    });
}

const api = {
    postEvents: post.bind(null, 'events'),
    validate: post.bind(null, 'validate'),
    handshake: post.bind(null, 'handshake')
};

export default api;
