var _ = require('lodash');
var debug = require('debug')('lib:utils');
var crypto = require('crypto');
var bs58 = require('bs58');
var nacl = require('tweetnacl');
var nconf = require('nconf');
var foodWords = require('food-words');

var hash = function(obj, fields) {
    if(_.isUndefined(fields))
        fields = _.keys(obj);
    var plaincnt = fields.reduce(function(memo, fname) {
        return memo += fname + "∴" + _.get(obj, fname, '…miss!') + ",";
    }, "");
    debug("Hashing of %s", plaincnt);
    sha1sum = crypto.createHash('sha1');
    sha1sum.update(plaincnt);
    return sha1sum.digest('hex');
};

var activeUserCount = function(usersByDay) {
    var uC = _.reduce(usersByDay, function(memo, stOb) {
        var date = stOb["_id"].year + '-' + stOb["_id"].month +
                   '-' + stOb["_id"].day;
        if(_.isUndefined(memo[date]))
            memo[date] = [];
        memo[date].push(stOb["_id"].user);
        return memo;
    }, {});
    return _.map(uC, function(datec, datek) {
        return {
            'date': datek,
            'count': _.size(datec)
        }
    });
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
    // Assume that the tuple (userId, publicKey) exists in the DB.
    var userId = req.headers['x-yttrex-userId'];
    var publicKey = req.headers['x-yttrex-publickey'];
    var signature = req.headers['x-yttrex-signature'];
    var message = req.body;

    // FIXME: apparently with Express 4 the body is a streamed buffer,
    // and I don't want to dig in that now. My "There I Fix It" solution
    // is to dump the json of the body in a string, and use that to verify
    // the signature.
    //
    //   WARNING!!!
    //   This works good when the client sending the data is in JavaScript
    //   as well, since key order is given by the insertion order.

    if (req.headers['content-type'] === 'application/json') {
        message = JSON.stringify(req.body)
    }

    return nacl.sign.detached.verify(
        stringToArray(message),
        decodeFromBase58(signature),
        decodeFromBase58(publicKey));
};

function string2Food(piistr) {
    /* this is fbtrex's pseudonymize */
    const numberOf = 3;
    const inputs = _.times(numberOf, function(i) {
        return _.reduce(i + piistr, function(memo, acharacter) {
            var x = memo * acharacter.charCodeAt(0);
            memo += ( x / 23 );
            return memo;
        }, 1);
    });
    const size = _.size(foodWords);
    const ret = _.map(inputs, function(pseudornumber) {
        return _.nth(foodWords, (_.round(pseudornumber) % size));
    });
    return _.join(ret, '-');
};

function parseIntNconf(name, def) {
    let value = nconf.get(name) ? nconf.get(name) : def;
    return _.parseInt(value);
}

function getInt(req, what, def) {                                                       
    var rv = _.parseInt(_.get(req.params, what));                                       
    if(_.isNaN(rv)) {                                                                   
        if(!_.isUndefined(def))                                                         
            rv  = def;                                                                  
        else  {                                                                         
            debug("getInt: Error with parameter [%s] in %j", what, req.params);         
            rv = 0;                                                                     
        }                                                                               
    }
    return rv;                                                                          
}                                                                                       

function getString(req, what) {                                                         
    var rv = _.get(req.params, what);                                                   
    if(_.isUndefined(rv)) {                                                             
        debug("getString: Missing parameter [%s] in %j", what, req.params);             
        return "";                                                                      
    }                                                                                   
    return rv;                                                                          
}                                                                                       

module.exports = {
    hash: hash,
    activeUserCount: activeUserCount,
    stringToArray: stringToArray,
    encodeToBase58: encodeToBase58,
    decodeFromBase58: decodeFromBase58,
    verifyRequestSignature: verifyRequestSignature,
    string2Food: string2Food,
    getInt: getInt,                                                                     
    getString: getString,
    parseIntNconf
};
