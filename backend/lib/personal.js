const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const debug = require('debug')('lib:personal');
const nconf = require('nconf');

const mongo = require('./mongo');
const utils = require('./utils');
const params = require('./params');

function getPersonal(req) {

    const k =  req.params.publicKey;
    const { amount, skip } = params.optionParsing(req.params.paging, 40);
    debug("Personal access, amount %d skip %d", amount, skip);

    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    return mongo
        .read(nconf.get('schema').supporters, { publicKey: k })
        .then(_.first)
        .then(function(profile) {
            if(!profile)
                throw new Error("publicKey do not match any user");

            return mongo
                .readLimit(nconf.get('schema').metadata, { watcher: profile.p }, { savingTime: -1 }, amount, skip)
                .map(function(m) {
                    let r = _.omit(m, ['_id']);
                    r.related = _.map(r.related, function(entry) { return _.omit(entry, ['mined']); });
                    r.relative = moment.duration( moment(m.savingTime) - moment() ).humanize() + " ago";
                    return r;
                })
                .then(function(metadata) {
                    return { json: {
                        profile: _.omit(profile, ['_id']),
                        metadata,
                    } };
                });
        })
        .catch(function(error) {
            debug("error: %s", error.message);
            return { json: {
                    "message": error.message,
                    "error": true
                }
            };
        });
};

function getRelated(supporter) {

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

    return mongo
        .aggregate(nconf.get('schema').metadata, [
            { $match: { 'watcher': supporter.p }},
            { $lookup: { from: 'videos', localField: 'id', foreignField: 'id', as: 'videos' }},
            { $unwind: '$related' }
        ]).map(function(r) {
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
};

function getPersonalCSV(req) {

    const k =  req.params.publicKey;
    if(_.size(k) < 30)
        return { json: { "message": "Invalid publicKey", "error": true }};

    return mongo
        .read(nconf.get('schema').supporters, { publicKey: k })
        .then(_.first)
        .then(getRelated)
        .then(produceCSVv1)
        .then(function(csv) {
            debug("personalCSV produced %d bytes", _.size(csv));

            if(!_.size(csv))
                return { text: "Error, Zorry: 🤷" };

            return {
                headers: {
                    "Content-Type": "csv/text",
                    "content-disposition": "attachment; filename=personal-yttrex.csv"
                },
                text: csv,
            };
        });
};


function produceCSVv1(entries) {

    const keys = _.keys(entries[0]);

    let produced = _.reduce(entries, function(memo, entry, cnt) {
        if(!memo.init) {
            memo.csv = _.trim(JSON.stringify(keys), '][') + "\n";
            memo.init = true;
        }

        _.each(keys, function(k, i) {
            let swap = _.get(entry, k, "");
            if(k == 'savingTime')
                memo.csv += moment(swap).toISOString();
            else if(_.isInteger(swap))
                memo.csv += swap;
            else {
                swap = _.replace(swap, /"/g, '〃');
                swap = _.replace(swap, /'/g, '’');
                memo.csv +=  '"' + swap + '"';
            }
            if(!_.eq(i, _.size(keys) - 1))
                memo.csv += ',';
        });
        memo.csv += "\n";
        return memo;

    }, { init: false, csv: "" });
    return produced.csv;
};



module.exports = {
    getPersonal,
    getPersonalCSV,
};
