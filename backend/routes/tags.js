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
    debug("add - Offered tag %s", tag)

    const current = await supporters.get(k);
    if(_.isUndefined(current.tags))
      current.tags = [];

    /* append the new tag only if actually 'new' */
    current.tags = _.uniq(current.tags.push(tag));
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
    debug("delete tag %s", tag);
    let current = await supporters.get(k);
    debug("before %j", current.tags)
    const tags = _.filter(current.tags, tag);
    debug("after %j", tags);
    current.tags = tags;

    const updated = await supporters.update(k, current)

    return { json: updated };
};

module.exports = {
  add,
  get,
  remove,
};
