var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('lib:utils');
var crypto = require('crypto');
var bs58 = require('bs58');
var nacl = require('tweetnacl');
var nconf = require('nconf');
var foodWords = require('food-words');


var shmFileWrite = function(fprefix, stringblob) {
    var fpath = "/dev/shm/" + fprefix + "-"
                + moment().format('hhmmss') + ".json";
    return Promise.resolve(
        fs.writeFileAsync(fpath, stringblob)
          .then(function(result) {
              debug("written debug file %s", fpath);
              return true;
          })
          .catch(function(error) {
              debug("Error in writting %s: %s", fpath, error);
              return false;
          })
    );
};

var hash = function(obj, fields) {
    if(_.isUndefined(fields))
        fields = _.keys(obj);
    var plaincnt = fields.reduce(function(memo, fname) {
        return memo += fname + "∴" + _.get(obj, fname, '…miss!') + ",";
        return memo;
    }, "");
    // debug("Hashing of %s", plaincnt);
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

var stripMongoId = function(collection) {
    return _.map(collection, function(entry) {
        return _.omit(entry, ['_id']);
    });
};


var topPostsFixer = function(mongocoll) {
    var MAX_ENTRIES = 20;
    var clean = _.reduce(mongocoll, function(memo, pe) {
        /* this in theory would be removed when mongoQuery is improved */
        if( _.eq(_.size(pe.users), 1))
            return memo;
        if( _.isNull(pe["_id"].postId))
            return memo;
        if( _.size(pe["_id"].postId + "") < 10)
            return memo;

        var times = _.sortBy(pe.times, moment);
        var msecduration = _.last(times) - _.first(times);
        var relative = moment() - _.first(times);

        /* is not kept 'first' because what matter is the creation time */
        memo.push({
                'postId': pe["_id"].postId,
                'lifespan': moment.duration(msecduration).humanize(),
                'when': moment.duration(relative).humanize(),
                'last': _.last(times),
                'users': pe.users,
                'count': _.size(pe.users)
            });
        return memo;
    }, []);

    return _.reverse(_.takeRight(_.sortBy(clean, 'count'), MAX_ENTRIES));
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

function string2Food(text) {
    var size = _.size(foodWords);
    var first = null;
    var number = _.reduce(_.split(text), function(memo, c) {
        if(c.charCodeAt() < 70)
            return memo * (c.charCodeAt() + 1);

        if(!(c.charCodeAt() % 6))
            first = _.nth(foodWords, memo % size );

        return c.charCodeAt() + memo;
    }, 1);

    if(_.isNull(first))
        var first = _.nth(foodWords, ( number % size));

    var second = _.nth(foodWords, ( (number * 2) % size));
    var third = _.nth(foodWords, ( (number * 3) % size));

    return [ first, second, third ].join('-');
};
       

module.exports = {
    hash: hash,
    activeUserCount: activeUserCount,
    shmFileWrite: shmFileWrite,
    stripMongoId: stripMongoId,
    topPostsFixer: topPostsFixer,
    stringToArray: stringToArray,
    encodeToBase58: encodeToBase58,
    decodeFromBase58: decodeFromBase58,
    verifyRequestSignature: verifyRequestSignature,
    string2Food: string2Food
};
