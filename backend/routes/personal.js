const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const debug = require('debug')('lib:personal');
const nconf = require('nconf');

const automo = require('../lib/automo');
const utils = require('../lib/utils');
const params = require('../lib/params');
const CSV = require('../lib/CSV');

async function getPersonal(req) {

    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const { amount, skip } = params.optionParsing(req.params.paging, 40);
    debug("Personal access, amount %d skip %d", amount, skip);

    const data = await automo.getMetadataByPublicKey(k, { amount, skip });

    let recent = _.map(data.metadata, function(m) {
        let r = _.omit(m, ['_id']);
        r.related = _.map(r.related, function(entry) { return _.omit(entry, ['mined']); });
        r.relative = moment.duration( moment(m.savingTime) - moment() ).humanize() + " ago";
        return r;
    });

    return { json: {
        profile: _.omit(data.supporter, ['_id']),
        recent,
    } };
};

async function getPersonalCSV(req) {

    const CSV_MAX_SIZE = 1000;
    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const data = await automo.getMetadataByPublicKey(k, { amount: CSV_MAX_SIZE, skip: 0 });
    const csv = CSV.produceCSVv1(related);

    debug("personalCSV produced %d bytes from %d entries (max %d)",
        _.size(csv), _.size(data), CSV_MAX_SIZE);

    if(!_.size(csv))
        return { text: "Error, Zorry: 🤷" };

    return {
        headers: {
            "Content-Type": "csv/text",
            "content-disposition": "attachment; filename=personal-yttrex.csv"
        },
        text: csv,
    };
};


async function getRelated(mongoc, supporter) {
    /* available structure 
     {
    "_id" : ObjectId("5cce22a8f64c0c7ef837fb52"),
    "id" : "eebdf0ba80f7bc050eb1463b6b20f51fc2cce4fe",
    "title" : "You Are Stealing Our Future: Greta Thunberg, 15, Condemns the World’s Inaction on Climate Change",
    "publicationString" : "Published on Dec 13, 2018",
    "authorName" : "Democracy Now!",
    "authorSource" : "/user/democracynow",
    "related" : {
        "index" : 1,
        "title" : "The disarming case to act right now on climate change | Greta Thunberg",
        "source" : "TED\nVerified\n•",
        "vizstr" : "510K views",
        "videoId" : "H2QxFM9y0tY",
        "displayTime" : "11:13",
        "expandedTime" : "11 minutes",
        "longlabel" : "The disarming case to act right now on climate change | Greta Thunberg by TED 2 months ago 11 minutes 510,780 views",
        "mined" : {
            "viz" : "510,780 views",
            "duration" : "11 minutes",
            "timeago" : "2 months ago",
            "title" : "The disarming case to act right now on climate change | Greta Thunberg by TED"
        }
    },
    "relatedN" : 20,
    "viewInfo" : {
        "viewStr" : "1,075,971 views",
        "viewNumber" : 1075971
    },
    "likeInfo" : {
        "likes" : null,
        "dislikes" : "29,634 likes"
    },
    "videoId" : "HzeekxtyFOY",
    "savingTime" : ISODate("2019-05-02T07:04:41.478Z"),
    "watcher" : "doughnut-berry-celery"
    }
     */

    let related = await getRelatedByWatcher(supporter.p);
    return _.map(related, function(r) {
        /* this is the same format in youtube.tracking.exposed/data */
        return {
            id: r.id,
            videoId: r.related.videoId,
            title: r.related.title,
            source: _.replace(r.related.source, /\n/g, ' ⁞ '),
            vizstr: r.related.vizstr,
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

    return related;
};


module.exports = {
    getPersonal,
    getPersonalCSV,
};
