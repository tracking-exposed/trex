const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:tags');

const supporters = require('../lib/supporters');

/* this function implement the RESTful interface:
  routes is always /api/v2/tags/$publicKey
  add (POST), get (GET), delete (DELETE) */

async function add(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const tag = req.body.tag;

    const current = await supporters.get(k);
    if(_.isUndefined(current.tags))
      current.tags = [];

    debug("Adding tag [%s] to '%s' currently belonging to %j", tag, current.p, current.tags);
    /* append the new tag only if actually 'new' */
    current.tags.push(tag);
    current.tags = _.uniq(current.tags);

    const updated = await supporters.update(k, current);
    return { json: updated };
};

async function get(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const current = await supporters.get(k);
    return { json: current };
};

async function remove(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const tag = req.body.tag;
    const current = await supporters.get(k);
    _.pull(current.tags, tag);

    const updated = await supporters.update(k, current);

    return { json: updated };
};

module.exports = {
  add,
  get,
  remove,
};
