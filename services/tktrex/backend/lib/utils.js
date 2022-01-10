const _ = require('lodash');
const debug = require('debug')('lib:utils');
const crypto = require('crypto');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const foodWords = require('food-words');

function hash(obj, fields) {
    if(_.isUndefined(fields))
        fields = _.keys(obj);
    const plaincnt = fields.reduce(function(memo, fname) {
        memo += (fname + "∴" +
            JSON.stringify(_.get(obj, fname, '…miss!')) +
            "," );
        return memo;
    }, "");
    debug("(note) hashing of %s", plaincnt);
    const sha1sum = crypto.createHash('sha1');
    sha1sum.update(plaincnt);
    return sha1sum.digest('hex');
};

function stringToArray (s) {
    // Credits: https://github.com/dchest/tweetnacl-util-js
    var d = unescape(encodeURIComponent(s));
    var b = new Uint8Array(d.length);

    for (var i = 0; i < d.length; i++) {
        b[i] = d.charCodeAt(i);
    }
    return b;
}

function encodeToBase58 (s) {
    return bs58.encode(s);
}

function decodeFromBase58 (s) {
    return new Uint8Array(bs58.decode(s));
}

function verifyRequestSignature(req) {
    // Warning: this is a duplication, also in events the
    // header list is defined, no sense specify here the key names:
    const publicKey = req.headers['x-tktrex-publickey'];
    const signature = req.headers['x-tktrex-signature'];
    let message = req.body;

    // FIXME: apparently with Express 4 the body is a streamed buffer,
    // and I don't want to dig in that now. My "There I Fix It" solution
    // is to dump the json of the body in a string, and use that to verify
    // the signature.
    //
    //   WARNING!!!
    //   This works good when the client sending the data is in JavaScript
    //   as well, since key order is given by the insertion order.

    if (req.headers['content-type'] === 'application/json')
        message = JSON.stringify(req.body)
    // this should always be the case as we use the express JSON-body middleware

    return nacl.sign.detached.verify(
        stringToArray(message),
        decodeFromBase58(signature),
        decodeFromBase58(publicKey));
};

function string2Food(piistr) {
    const numberOf = 3;
    const inputs = _.times(numberOf, function(i) {
        return _.reduce(i + piistr, function(memo, acharacter) {
            /* charCodeAt never return 0 as number */
            let x = memo * acharacter.charCodeAt(0);
            memo += ( x / 23 );
            return memo;
        }, 1);
    });
    const size = _.size(foodWords);
    const ret = _.map(inputs, function(pseudornumber) {
        /* considering the calculus above would produce a
           number that might be < foodWords.length and with decimals,
           it is multiply by 1000 to be sure would be bigger than
           variable 'size' */
        return _.nth(foodWords,
            (_.round(pseudornumber * 1000) % size));
    });
    return _.join(ret, '-');
};

function pickFoodWord(rginput) {
    const seed = hash({ rginput }).replace(/[a-f]/gi, '')

    const rnum = seed.length > 5 ?
        _.parseInt(seed.substr(0, 5)) :
        _.parseInt(seed) + rginput.length;

    const wordpos = rnum % foodWords.length;
    /* debug("pickFoodWord number %d, module %d, word [%s]",
        rnum, wordpos, _.nth(foodWords, wordpos)); */
    return _.nth(foodWords, wordpos);
}

function getInt(req, what, def) {
    const rv = _.parseInt(_.get(req.params, what));
    if(_.isNaN(rv)) {
        if(!_.isUndefined(def))
            return def;
        else  {
            debug("getInt: Error with parameter [%s] in %j", what, req.params);
            throw new Error("Invalid integer in params " + req.params[what]);
        }
    }
    return rv;
}

function getString(req, what) {
    const rv = _.get(req.params, what);
    if(_.isUndefined(rv)) {
        debug("getString: Missing parameter [%s] in %j", what, req.params);
        return "";
    }
    return rv;
}

module.exports = {
    hash,
    stringToArray,
    encodeToBase58,
    decodeFromBase58,
    verifyRequestSignature,
    string2Food,
    pickFoodWord,
    getInt,
    getString,
};
