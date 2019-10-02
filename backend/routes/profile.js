const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:tags');

const mongo3 = require('../lib/mongo3');
const utils = require('../lib/utils');
const supporters = require('../lib/supporters');

/* this function implement the RESTful interface:
  routes is always /api/v2/tags/$publicKey
  add (POST), get (GET), delete (DELETE) */

async function updateProfile(req) {
  debug("POST-updateProfile")
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

async function createTag(req) {
  debug("POST-createTag")
  /* receive a new group, a password, and a flag private|public */
  const tag = req.body.tag 
  const password = req.body.password
  const public = req.body.public

  const id = utils.hash({
    kind: "this-is-hashed-with-the-password-to-link-or-not-private-group", 
    passowrd: password 
  });
  const mongoc = await mongo3.clientConnect({concurrency: 1});

  const exists = await mongo3.readOne(mongoc, nconf.get('schema').groups, { 
    id, tag 
  });
  debug("OU_ esiste %j", exists);
  const refresh = await mongo3.upsertOne(mongoc, nconf.get('schema').groups, { 
    id, tag 
  }, {
    id,
    tag,
    lastAccess: new Date(),
    public
  });
  debug("OU_ upsert %j", refresh);

  return { json: refresh};
}

async function profileStatus(req) {
    debug("GET");
    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const current = await supporters.get(k);
    return { json: current };
};

async function removeTag(req) {
    const tagId =  req.params.tagId;
    const k =  req.params.publicKey;
  debug("DELETE %s %s", tagId, k);

    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    debuggr;
    const tag = req.body.tag;
    debug("remove tag %s via BODY", tag);
    const current = await supporters.get(k);
    _.pull(current.tags, tag);

    const updated = await supporters.update(k, current);
    return { json: updated };
};

module.exports = {
  updateProfile,
  profileStatus,
  removeTag,
  createTag,
};