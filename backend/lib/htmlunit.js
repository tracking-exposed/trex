var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('lib:htmlunit');
var nconf = require('nconf');

const automo = require('./automo');

async function unitById(req) {
    var htmlId = req.params.metadataId;
    const r = await automo.getVideosByPublicKey(publicKey, { id: metadataId }, htmlToo);
    debug("loofing for html+metadata by metadataId %s, found %d m %d h", metadataId, _.size(r.metadata), _.size(r.html));
    return { json: r };
}

module.exports = {
    unitById:unitById
};
