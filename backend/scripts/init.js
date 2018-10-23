
var Promise = require('bluebird');
var nconf = require('nconf');
var debug = require('debug')('init');
var mongo = require('../lib/mongo');

nconf.argv().env().file({ file: "config/settings.json" });

debug("Initializing three indexes: %s", destCollection);
return Promise.all([
    mongo.createIndex( nconf.get('schema').commitments, { videoId: 1, p: 1 }, { unique: true }),
    mongo.createIndex( nconf.get('schema').commitments, { videoId: 1 }),
    mongo.createIndex( nconf.get('schema').commitments, { commitTime: 1 }, { expireAfterSeconds: 3600 * 24 }),

    mongo.createIndex( nconf.get('schema').videos, { id: 1 }, { unique: true }),
]);
