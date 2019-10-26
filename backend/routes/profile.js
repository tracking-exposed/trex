const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:profile');
const nconf = require('nconf');

const mongo3 = require('../lib/mongo3');
const utils = require('../lib/utils');
const supporters = require('../lib/supporters');

/* This function implement the RESTful interface:
   routes is always /api/v2/profile/$publicKey/tag in regards of new group tagging 
   routes /api/v2/profile/$publicKey POST is relative on upgrading your user profile */

async function updateTagInProfile(group, k) {
    /* utility function used in createTag and updateProfile */
    const profile = await supporters.get(k);

    if(profile.tag && profile.tag.name)
        debug("Profile %s currently tag %s but is replaced by %s", profile.p, profile.tag.name, group.name);
    else
        debug("Profile %s is marking to belong %s tag", profile.p, group.name);

    profile.tag = group;
    return await supporters.update(k, profile);
}

/* THE API implementation starts here */
async function updateProfile(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const tag = req.body.tag;
    const password = req.body.password;

    const id = utils.hash({
        fixedSalt: "https://github.com/tracking-exposed/",
        name: tag,
        password
    });

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const exists = await mongo3.readOne(mongoc, nconf.get('schema').groups, { id });

    debug("updateProfile (tag): %j new %s", exists, tag)
    if(!exists || exists.name !== tag)
        return { json: { error: true, message: `Group ${tag} not found or not accessible with the password provided` }};

    const updated = await updateTagInProfile(exists, k);

    await mongoc.close();
    return { json: updated };
};

async function createTag(req) {
    /* receive a new group, a password, and a flag private|public */
    const PASSWORD_MIN = 8;
    const tag = req.body.tag;
    const password = req.body.password;
    const description = req.body.description;
    const accessibility = (req.body.accessibility == "public") ? "public" : "private";

    const k =  req.params.publicKey;
    if(_.size(k) < 26) // This is not a precise number. why I'm even using this check?
        return { json: { "message": "Invalid publicKey", "error": true }};

    if(_.size(tag) < 1)
        return { json: { error: true, message: `Group name (tag parameter) shoulbe be a string with more than 1 char` }};

    if(_.size(description) < 1)
        return { json: { error: true, message: "When a new group is created a description is mandatory" }};

    if(_.size(password) < PASSWORD_MIN && accessibility == 'private')
        return { json: { error: true, message: `Password should be more than ${PASSWORD_MIN} bytes` }};

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const exists = await mongo3.readOne(mongoc, nconf.get('schema').groups, { name: tag });

    if(_.get(exists, 'id'))
        return { json: { error: true, message: `Group '${tag}' exists. Creation not allow` }};

    /* creation of the group. the ID can't be addressed directly, the API must receive groupName+password to find it */
    const id = utils.hash({
        fixedSalt: "https://github.com/tracking-exposed/",
        name: tag,
        password
    });
    const createdTag = {
        id,
        name: tag,
        accessibility,
        lastAccess: new Date(),
        description,
    };

    debug("createTag: %s, %s, %s", tag, id, accessibility);
    await mongo3.writeOne(mongoc, nconf.get('schema').groups, createdTag);

    /* this API call also mark the calling profile as part of the new group */
    const updated = await updateTagInProfile(createdTag, k);

    await mongoc.close();
    return { json: {
        group: createdTag,
        created: true,
        profile: updated
    }};
}

async function profileStatus(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const profile = await supporters.get(k);
    return { json: profile };
};

async function removeTag(req) {
    const tagId =  req.params.tagId;
    const k =  req.params.publicKey;

    if(_.size(k) < 26) // (shrug emoji)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const profile = await supporters.get(k);
    if(profile.tag.id == tagId) {
        _.unset(profile, 'tag');
        const updated = await supporters.update(k, profile);
        return { json: updated };
    } else {
        debug("Remove fail: Invalid tagId requested? %s",
            JSON.stringify(profile, null, 2));
        return { json: updated };
    }
};

module.exports = {
    updateProfile,
    profileStatus,
    removeTag,
    createTag,
};
