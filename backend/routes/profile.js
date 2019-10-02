const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:tags');
const nconf = require('nconf');

const mongo3 = require('../lib/mongo3');
const utils = require('../lib/utils');
const supporters = require('../lib/supporters');

/*
 * This function implement the RESTful interface:
   routes is always /api/v2/profile/$publicKey/tag in regards of new group tagging 
   routes /api/v2/profile/$publicKey POST is relative on upgrading your user profile */

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
    /* receive a new group, a password, and a flag private|public */
    const PASSWORD_MIN = 7;
    const tag = req.body.tag 
    const password = req.body.password
    debug("%j", req.body);
    const accessibility = req.body.public ? "public" : "private"

    if(_.size(tag) < 1)
        return { json: { error: true, message: `Group name (tag parameter) shoulbe be a string with more than 1 char` }};

    if(_.size(password) < PASSWORD_MIN && accessibility == 'private')
        return { json: { error: true, message: `Password should be more than ${PASSWORD_MIN} bytes` }};

    const id = utils.hash({
        kind: "this-is-hashed-with-pass+name-to-allow-only-ppls-with-password-to-query-the-id",
        name: tag,
        passowrd: password,
        accessibility
    });
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const exists = await mongo3.readOne(mongoc, nconf.get('schema').groups, { 
        tag
    });

    if(_.get(exists, 'id'))
        return { json: { error: true, message: `Group ${tag} exists. Creation not allow` }};

    const createdTag = {
        id,
        tag,
        accessibility,
        lastAccess: new Date(),
    };
    const refresh = await mongo3.upsertOne(mongoc, nconf.get('schema').groups, { 
        id, tag, accessibility
    }, createdTag);

    await mongoc.close();
    return { json: { group: createdTag, created: true }};
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
