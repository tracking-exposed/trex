import automo from '../lib/automo';

const _ = require('lodash');
const debug = require('debug')('routes:htmlunit');

async function unitById(req) {
    const mId = req.params.metadataId;
    const r = await automo.getHTMLVideosByMetadataId(mId);
    debug("loofing for html+metadata by metadataId %s, found %d htmls", mId, _.size(r));
    return { json: r };
}

module.exports = {
    unitById,
};
