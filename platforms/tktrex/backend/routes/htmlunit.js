var _ = require('lodash');
var debug = require('debug')('lib:htmlunit');
var nconf = require('nconf');

const mongo3 = require('@shared/providers/mongo.provider');
const utils = require('../lib/utils');

async function unitById(req) {
    const htmlId = utils.getString(req, 'htmlId');

    const mongoc = await mongo3.clientConnect();
    const html = await mongo3
        .readOne(mongoc, nconf.get('schema').htmls, { id: htmlId});
    const metadata = await mongo3
        .readOne(mongoc, nconf.get('schema').metadata, { id: htmlId});

    debug("unitById %s html <%s> metadata <%s>",
        htmlId, html.id.length, metadata.id.length);

    await mongoc.close();
    return { json: {
        metadata,
        html
    }};
}

module.exports = {
    unitById
};
