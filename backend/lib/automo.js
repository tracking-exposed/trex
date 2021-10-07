/* automo.js means "automongo".
 * This library should be included most of the time, because implement high level functions about mongodb access.
 * all the functions implemented in routes, libraries, and whatsoever, should be implemented here.
 *
 * The module mongo3.js MUST be used only in special cases where concurrency wants to be controlled
 */
const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('lib:automo');
const debugLite = require('debug')('lib:automo:L');
const moment = require('moment');

const utils = require('../lib/utils');
const mongo3 = require('./mongo3');

const DEFAULTMAX = 100;

async function getSummaryByPublicKey(publicKey, kind) {
    /* this function return the basic information necessary to compile the
       landing personal page, 'options' might specify for specific details */
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const supporter = await mongo3.readOne(mongoc,
        nconf.get('schema').supporters, { publicKey });

    if(!supporter || !supporter.publicKey)
        throw new Error("Authentication failure");

    const options = { skip: 0, amount: DEFAULTMAX };

    // the 'type' home is the only one supported and hardcoded ATM
    const homedata = await mongo3.aggregate(mongoc, nconf.get('schema').metadata, [
        { $match: { publicKey, type:'home', profileStory: { "$exists": true }} },
        { $unwind: "$sections" },
        { $unwind: "$sections.videos" },
        { $lookup: {
            from: 'categories',
            localField: "sections.videos.videoId",
            foreignField: 'videoId',
            as: 'categories'
        } }
    ]);
    const total = await mongo3.count(mongoc,
        nconf.get('schema').metadata, {
            publicKey: supporter.publicKey, type: 'home'
        });
    await mongoc.close();
    return { supporter, homedata, total };
}

async function getMetadataByPublicKey(publicKey, options) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const supporter = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });

    if(!supporter)
        throw new Error("publicKey do not match any user");

    const metadata = await mongo3.readLimit(mongoc,
        nconf.get('schema').metadata, { publicKey: supporter.publicKey }, { savingTime: -1 },
        options.amount, options.skip);

    await mongoc.close();
    return { supporter, metadata };
};

async function getMetadataByFilter(filter, options) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const metadata = await mongo3.readLimit(mongoc,
        nconf.get('schema').metadata, filter, { savingTime: -1 },
        options.amount, options.skip);

    await mongoc.close();
    return metadata;
};

async function getMetadataFromAuthor(filter, options) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const sourceVideo = await mongo3.readOne(mongoc,
        nconf.get('schema').metadata, filter);

    if(!sourceVideo || !sourceVideo.id)
        throw new Error("Video not found, invalid videoId");

    const videos = await mongo3.readLimit(mongoc,
        nconf.get('schema').metadata, { authorSource: sourceVideo.authorSource},
        { savingTime: -1 }, options.amount, options.skip);

    const total = await mongo3.count(mongoc,
        nconf.get('schema').metadata, { authorSource: sourceVideo.authorSource});

    await mongoc.close();
    return {
        content: videos,
        total,
        pagination: options,
        authorName: sourceVideo.authorName,
        authorSource: sourceVideo.authorSource,
    }
};

async function getRelatedByWatcher(publicKey, options) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const supporter = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });
    if(!supporter)
        throw new Error("publicKey do not match any user");

    const related = await mongo3
        .aggregate(mongoc, nconf.get('schema').metadata, [
            { $match: { 'watcher': supporter.p }},
            { $sort: { savingTime: -1 }},
            { $skip: options.skip },
            { $limit : options.amount },
            { $lookup: { from: 'videos', localField: 'id', foreignField: 'id', as: 'videos' }},
            { $unwind: '$related' }
        ]);
    await mongoc.close();
    return related;
}

async function getVideosByPublicKey(publicKey, filter) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const supporter = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });
    if(!supporter)
        throw new Error("publicKey do not match any user");

    const selector = _.set(filter, 'p', supporter.p);
    debug("getVideosByPublicKey with flexible selector (%j)", filter);
    const matches = await mongo3.read(mongoc, nconf.get('schema').videos, selector, { savingTime: -1 });
    await mongoc.close();

    return matches;
};

async function getFirstVideos(when, options) {
    // expected when to be a moment(), TODO assert when.isValid()
    // function used from routes/rsync
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const selected = await mongo3
        .readLimit(mongoc,
            nconf.get('schema').videos,
            { savingTime: { $gte: new Date(when.toISOString()) }}, { savingTime: 1 },
            options.amount, options.skip);
    await mongoc.close();
    return selected;
};

async function deleteEntry(publicKey, id) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const supporter = await mongo3.readOne(mongoc, nconf.get('schema').supporters, { publicKey });
    if(!supporter)
        throw new Error("publicKey do not match any user");

    const htmls = await mongo3.deleteMany(mongoc, nconf.get('schema').htmls, {
        metadataId: id,
        publicKey: supporter.publicKey
    });
    const metadata = await mongo3.deleteMany(mongoc, nconf.get('schema').metadata, {
        id: id,
        publicKey: supporter.publicKey
    });
    await mongoc.close();
    return { htmls, metadata };
};

async function getRelatedByVideoId(videoId, options) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const related = await mongo3
        .aggregate(mongoc, nconf.get('schema').metadata, [
            { $match: { videoId: videoId } },
            { $sort: { savingTime: -1 }},
            { $skip: options.skip },
            { $limit : options.amount },
            // { $lookup: { from: 'videos', localField: 'id', foreignField: 'id', as: 'videos' }},
            // TODO verify how this work between v1 and v2 transition
            { $unwind: '$related' },
            { $sort: { savingTime: -1 }}
        ]);
    await mongoc.close();
    debug("Aggregate of getRelated: %d entries", _.size(related));
    return _.map(related, function(r) {
        return {
            id: r.id.substr(0, 20),
            videoId: r.related.videoId,
            title: r.related.title,
            verified: r.related.verified,
            source: r.related.source,
            vizstr: r.related.vizstr,
            foryou: r.related.foryou,
            suggestionOrder: r.related.index,
            displayLength: r.related.displayTime,
            watched: r.title,
            since: r.publicationString,
            credited: r.authorName,
            channel: r.authorSource,
            savingTime: r.savingTime,
            watcher: r.watcher,
            watchedId: r.videoId,
        };
    });
}

async function write(where, what) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    let retv;
    try {
        await mongo3.insertMany(mongoc, where, what);
        retv = { error: false, ok: _.size(what) };
    } catch(error) {
        debug("%s %j", error.message, _.keys(errors));
        retv = { error: true, info: error.message };
    } finally {
        await mongoc.close();
        return retv;
    }
}

async function tofu(publicKey, version) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    let supporter = await mongo3.readOne(mongoc,
        nconf.get('schema').supporters, { publicKey });

    if( !! _.get(supporter, '_id') ) {
        supporter.lastActivity = new Date();
        supporter.version = version;
        await mongo3.updateOne(mongoc,
            nconf.get('schema').supporters, { publicKey }, supporter);
    } else {
        supporter = {};
        supporter.publicKey = publicKey;
        supporter.version = version;
        supporter.creationTime = new Date();
        supporter.lastActivity = new Date();
        supporter.p = utils.string2Food(publicKey);
        debug("TOFU: new publicKey received, from: %s", supporter.p);
        await mongo3.writeOne(mongoc,
            nconf.get('schema').supporters, supporter);
    }

    await mongoc.close();
    return supporter;
}

async function getLastHTMLs(filter, skip, limit) {

    const HARDCODED_LIMIT = 20;
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const htmls = await mongo3.readLimit(mongoc,
        nconf.get('schema').htmls, filter,
        { savingTime: 1},
        limit ? limit : HARDCODED_LIMIT,
        skip ? skip : 0);

    if(_.size(htmls))
        debug("getLastHTMLs: %j -> %d (overflow %s)%s", filter, _.size(htmls),
            (_.size(htmls) == HARDCODED_LIMIT), skip ? "skip " + skip : "");

    mongoc.close();
    return {
        overflow: _.size(htmls) == HARDCODED_LIMIT,
        content: htmls
    }
}

async function markHTMLsUnprocessable(htmls) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const ids = _.map(htmls, 'id');
    const r = await mongo3.updateMany(mongoc, nconf.get('schema').htmls,
        { id: { $in: ids }}, { processed: false });

    if( r.result.n != _.size(ids) ||
        r.result.nModified != _.size(ids) ||
        r.result.ok != 1) {
        debug("Odd condition in multiple update! %j", r.result);
    }
    await mongoc.close();
}

async function updateMetadata(html, newsection) {

    async function markHTMLandClose(mongoc, html, retval) {
        await mongo3.updateOne(mongoc, nconf.get('schema').htmls, { id: html.id }, { processed: true });
        await mongoc.close();
        return retval;
    }

    // we should look at the same metadataId in the
    // metadata collection, and update new information
    // if missing
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    if(!html.metadataId) {
        debug("metadataId is not an ID!");
        return await markHTMLandClose(mongoc, html, { what: 'not an ID'});
    }

    const exists = await mongo3.readOne(mongoc, nconf.get('schema').metadata, { id: html.metadataId });

    if(!exists) {
        await createMetadataEntry(mongoc, html, newsection);
        debug("Created metadata %s from %s with %s", html.metadataId, html.href, html.selector);
        return await markHTMLandClose(mongoc, html, { what: 'created'});
    }

    let updates = 0;
    let forceu = false;
    /* we don't care of these updates */
    const careless = [ 'clientTime', 'savingTime', 'size' ];
    /* this is meant to add only fields with values, and to notify duplicated
     * conflictual metadata mined, or extend labels as list */
    const up = _.reduce(newsection, function(memo, value, key) {

        if(!value || !_.size(value))
            return memo;

        let current = _.get(memo, key);
        if(!current) {
            _.set(memo, key, value);
            updates++;
        } else if(_.indexOf(careless, key) == -1) {
            /* we don't care of these updates */
        } else if(!_.isEqual(JSON.stringify(current), JSON.stringify(value))) {
            const record = {
                clientTime: html.clientTime,
                // selector: html.selector,
                value,
                key,
            };

            debug("record update in %s c[%s --- %s]v", key, current, value)

            if(_.isUndefined(memo.variation))
                memo.variation = [ record ];
            else
                memo.variation.push(record);

            forceu = true;
        } else {
            /* no update */
        }
        return memo;
    }, exists);

    debug("Evalutatig if update metadata %s (%s) %d updates, force %s",
        html.metadataId, html.selector, updates, forceu);

    if(forceu || updates ) {
        debug("Update from incremental %d to %d", exists.incremental, up.incremental);
        debug("test %j --- %j", _.keys(exists), _.keys(up));
        let r = await mongo3.updateOne(mongoc, nconf.get('schema').metadata, { id: html.metadataId }, up );
        return await markHTMLandClose(mongoc, html, { what: 'updated'});
    }
    return await markHTMLandClose(mongoc, html, { what: 'duplicated'});
}

async function createMetadataEntry(mongoc, html, newsection) {
    exists = {};
    exists.publicKey = html.publicKey;
    exists.savingTime = html.savingTime;
    exists.version = 3;
    exists = _.extend(exists, newsection);
    exists.id = html.metadataId;
    await mongo3.writeOne(mongoc, nconf.get('schema').metadata, exists);
    return exists;
}

async function getRandomRecent(minTime, maxAmount) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const supporters = await mongo3.readLimit(mongoc, nconf.get('schema').supporters, {
        lastActivity: { $gt: minTime }
    }, { lastActivity: -1}, maxAmount, 0);

    const validExamples = [];
    for (supporter of supporters) {
        let i = await mongo3.count(mongoc, nconf.get('schema').metadata, {
            publicKey: supporter.publicKey,
            type: 'video'
        });
        if(i > 2)
            validExamples.push(supporter);
    }

    await mongoc.close();
    return validExamples;
}

async function getMixedDataSince(schema, since, maxAmount) {

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const retContent = [];

    for (let cinfo of schema) {
        let columnName = _.first(cinfo);
        let fields = _.nth(cinfo, 1);
        let timevar = _.last(cinfo);
        let filter = _.set({}, timevar, { $gt: since});

        /* it prefer the last samples, that's wgy the sort -1 */
        const r = await mongo3.readLimit(mongoc,
            nconf.get('schema')[columnName], filter, _.set({}, timevar, -1),
            maxAmount, 0);

        /* if an overflow is spotted, with message is appended */
        if(_.size(r) == maxAmount)
            retContent.push({
                template: 'info',
                message: 'Whoa, too many! capped limit at ' + maxAmount,
                subject: columnName,
                id: "info-" + _.random(0, 0xffff),
                timevar: new Date(
                    moment(_.last(r)[timevar]).subtract(1, 'ms').toISOString()
                ),
                /* one second is added to be sure the alarm message appears after the
                 * last, and not in between the HTMLs/metadatas */
            });

        /* every object has a variable named 'timevar', and the $timevar we
         * used to pick the most recent 200 is renamed as 'timevar'. This allow
         * us to sort properly the sequence of events happen server side */
        _.each(r, function(o) {
            let good = _.pick(o, fields)
            good.template = columnName;
            good.relative = _.round(
                moment.duration( moment() - moment(o[timevar]) ).asSeconds()
            , 1);

            good['timevar'] = new Date(o[timevar]);
            good.printable = moment(good['timevar']).format('HH:mm:ss');
            _.unset(good, timevar);

            /* supporters, or who know in the future, might have not an 'id'.
               it is mandatory for client side logic, so it is attributed random */
            if(_.isUndefined(good.id))
                _.set(good, 'id', "RANDOM-" + _.random(0, 0xffff));

            retContent.push(good);
        });
    }

    await mongoc.close();
    return retContent;
}

async function getArbitrary(filter, amount, skip) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const r = await mongo3.readLimit(mongoc,
        nconf.get('schema').metadata,
        filter, {
            savingTime: -1
        }, amount, skip);
    await mongoc.close();
    return r;
}

module.exports = {
    /* used by routes/personal */
    getSummaryByPublicKey,
    getMetadataByPublicKey,
    getRelatedByWatcher,
    getVideosByPublicKey,
    deleteEntry,

    /* used by routes/public */
    getMetadataByFilter,
    getMetadataFromAuthor,
    getRandomRecent,
    getArbitrary,

    /* used by routes/rsync */
    getFirstVideos,

    /* used by public/videoCSV */
    getRelatedByVideoId,

    /* used in events.js processInput */
    tofu,
    write,

    /* used in parserv2 */
    getLastHTMLs,
    updateMetadata,
    markHTMLsUnprocessable,

    /* used by monitor */
    getMixedDataSince,
};