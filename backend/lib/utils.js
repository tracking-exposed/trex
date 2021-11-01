const _ = require('lodash');
const debug = require('debug')('lib:utils');
const crypto = require('crypto');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const nconf = require('nconf');
const foodWords = require('food-words');
const url = require('url');
const qustr = require('querystring');

function hash(obj, fields) {
    if(_.isUndefined(fields))
        fields = _.keys(obj);
    var plaincnt = fields.reduce(function(memo, fname) {
        return memo +=
            fname +
            "∴" +
            JSON.stringify(_.get(obj, fname, '…miss!')) +
            ",";
    }, "");
    // debug("Hashing of %s", plaincnt);
    sha1sum = crypto.createHash('sha1');
    sha1sum.update(plaincnt);
    return sha1sum.digest('hex');
};

function forceInteger(stri) {
    // sometime you've "323,333 mi piace" or "gustaria a 222 333 personas" this filter+trim+parse only integer seqences 
    const digits = _.filter(stri, function(c) {
        return _.isInteger(_.parseInt(c))
    }).join("");
    return _.parseInt(digits);
}

function parseLikes(likeInfo) {
    if(!likeInfo)
        return { watchedLikes: null, watchedDislikes: null };

    watchedLikes = forceInteger(likeInfo.likes);
    watchedDislikes = forceInteger(likeInfo.dislikes);

    return {watchedLikes, watchedDislikes };
}

function activeUserCount(usersByDay) {
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

function prettify(content, maxSize) {
    /* content might be an object or might not be */
    let unrolled = typeof(content) === typeof({}) ? JSON.stringify(content) : content;
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

    if(key == 'title' && _.size(value) && _.size(current) && current != value)
        debug("title conflict in the same metadata.id 🤯 good fucking luck:\ncurrent <%s> new <%s>", current, value);

    // definitive code is below, above only debug lines.
    if( typeof value == typeof(1) )
        return (value !== current); // if return true overrides
    if( typeof value == typeof('str') )
        return _.size(value) > _.size(current); // if bigger overrides
    if( typeof value == typeof(true) )
        return current !== value;  // if different overrides
    if( _.get(value, 'getDate') && value.getDate() )
        return false;
    if( typeof value == typeof([]) )
        return _.size(JSON.stringify(value)) > _.size(JSON.stringify(current));
    if( _.isNull(value) || _.isUndefined(value) )
        return true;
    debug("Unexpected kind? %s %j %j", key, current, value)
}

function getNatureFromURL(href) {
    // this function MUST support the different URLs
    // format specify in ../../extension/src/consideredURLs.js
    const uq = url.parse(href);
    if(uq.pathname == '/results') {
        const searchTerms = _.trim(qustr.parse(uq.query).search_query);
        return {
            type: 'search',
            query: searchTerms,
        }
    } else if(uq.pathname == '/watch') {
        const videoId = _.trim(qustr.parse(uq.query).v);
        return {
            type: 'video',
            videoId,
        }
    } else if(uq.pathname == '/') {
        return {
            type: 'home'
        }
    } else if(_.startsWith(uq.pathname, '/hashtag')) {
        debug("PLEASE SUPPORT");
    } else if(_.startsWith(uq.pathname, '/channel')) {
        debug("PLEASE SUPPORT");
    } else {
        return {
            type: 'unknown'
        }
    }
}

function extendIfExperiment(expinfo, listOf) {
    if(expinfo && expinfo.experimentId) {
        debug("Marking %d objects as part of the experiment %s",
            listOf.length, expinfo.experimentId);
        return _.map(listOf, function(o) {
            o.experiment = expinfo.experimentId;
            return o;
        });
    } else
        return listOf;
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
    extendIfExperiment,
};
