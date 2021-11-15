const _ = require('lodash');
const debug = require('debug')('lib:utils');
const crypto = require('crypto');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const nconf = require('nconf');
const foodWords = require('food-words');
const url = require('url');
const querystring = require('querystring');

function hash(obj, fields) {
    if(_.isUndefined(fields))
        fields = _.keys(obj);
    const plaincnt = fields.reduce(function(memo, fname) {
        memo += (fname + "∴" +
            JSON.stringify(_.get(obj, fname, '…miss!')) +
            "," );
        return memo;
    }, "");
    // debug("Hashing of %s", plaincnt);
    const sha1sum = crypto.createHash('sha1');
    sha1sum.update(plaincnt);
    return sha1sum.digest('hex');
};

function forceInteger(stri) {
    const digits = _.filter(stri, function(c) {
        return _.isInteger(_.parseInt(c))
    }).join("");
    if(stri.length !== digits.length) {
        debug("forceInteger convert %s in %s and then %d",
            stri, digits, _.parseInt(digits) );
    }
    return _.parseInt(digits);
}

function parseLikes(likeInfo) {
    if(!likeInfo)
        return { 'watchedLikes': null,
            'watchedDislikes': null
        };
    return {
        'watchedLikes': forceInteger(likeInfo.likes),
        'watchedDislikes': forceInteger(likeInfo.dislikes)
    };
}

function activeUserCount(usersByDay) {
    const uC = _.reduce(usersByDay, function(memo, stOb) {
        const date = stOb._id.year + '-' + stOb._id.month +
                   '-' + stOb._id.day;
        if(_.isUndefined(memo[date]))
            memo[date] = [];
        memo[date].push(stOb._id.user);
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
    const d = unescape(encodeURIComponent(s));
    const b = new Uint8Array(d.length);

    for (let i = 0; i < d.length; i++) {
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
    const publicKey = req.headers['x-yttrex-publickey'];
    const signature = req.headers['x-yttrex-signature'];
    let message = req.body;

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
            const x = memo * acharacter.charCodeAt(0);
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
    const value = nconf.get(name) ? nconf.get(name) : def;
    return _.parseInt(value);
}

function getInt(req, what, def) {
    let rv = _.parseInt(_.get(req.params, what));
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
    const rv = _.get(req.params, what);
    if(_.isUndefined(rv)) {
        debug("getString: Missing parameter [%s] in %j", what, req.params);
        return "";
    }
    return rv;
}

function prettify(content, maxSize) {
    /* content might be an object or might not be */
    const unrolled = typeof(content) === typeof({}) ? JSON.stringify(content) : content;
    return _.size(unrolled.toString()) > maxSize ? unrolled.toString().substr(0, maxSize) + '…' : unrolled;
}

function judgeIncrement(key, current, value) {
    // this function evaluate if a new object is "fresher" in 
    // than an older content. it consider sizes. 
    // special keys might got different treatment 
    // it is used by automo.js in db metadata updates

    /* if(key == 'related' || key == 'selected') {
        let c = _.map(current, 'videoId');
        let n = _.map(value, 'videoId');
        let x = _.difference( _.sortBy(c), _.sortBy(n) );
        let y = _.difference( _.sortBy(n), _.sortBy(c) );
        if(_.size(x) != _.size(y)) 
            debug("Difference seen in %s: current %d new %d diff <%d|%d>", key,
                _.size(c), _.size(n), _.size(x), _.size(y) );
    } */

    if(key === 'title' && _.size(value) && _.size(current) && current !== value)
        debug("title conflict in the same metadata.id 🤯 good fucking luck:\ncurrent <%s> new <%s>", current, value);

    // definitive code is below, above only debug lines.
    if( typeof value === typeof(1) )
        return (value !== current); // if return true overrides
    if( typeof value === typeof('str') )
        return _.size(value) > _.size(current); // if bigger overrides
    if( typeof value === typeof(true) )
        return current !== value;  // if different overrides
    if( _.get(value, 'getDate') && value.getDate() )
        return false;
    if( typeof value === typeof([]) )
        return _.size(JSON.stringify(value)) > _.size(JSON.stringify(current));
    if( _.isNull(value) || _.isUndefined(value) )
        return true;
    debug("Unexpected kind? %s %j %j", key, current, value)
}

function getNatureFromURL(href) {
    // this function MUST support the different URLs
    // format specify in ../../extension/src/consideredURLs.js
    const uq = new url.URL(href);
    if(uq.pathname === '/results') {
        const searchTerms = uq.searchParams.get('search_query');
        return {
            type: 'search',
            query: searchTerms,
        }
    } else if(uq.pathname === '/watch') {
        const videoId = uq.searchParams.get('v');
        return {
            type: 'video',
            videoId,
        }
    } else if(uq.pathname === '/') {
        return {
            type: 'home',
        }
    } else if(_.startsWith(uq.pathname, '/hashtag')) {
        const hashtag = uq.pathname.split('/').pop();
        return {
            type: 'hashtag',
            hashtag,
        }
    } else if(
        _.startsWith(uq.pathname, '/channel') ||
        _.startsWith(uq.pathname, '/user') ||
        _.startsWith(uq.pathname, '/c')) {
        const authorSource = uq.pathname.split('/').pop();
        return {
            type: 'channel',
            authorSource,
        }
    } else {
        debug("Unknow condition: %s", uq.href);
        return {
            type: 'unknown'
        }
    }
}

module.exports = {
    hash,
    activeUserCount,
    parseLikes,
    stringToArray,
    encodeToBase58,
    decodeFromBase58,
    verifyRequestSignature,
    string2Food,
    getInt,                                                                     
    getString,
    parseIntNconf,
    prettify,
    judgeIncrement,
    getNatureFromURL,
};
