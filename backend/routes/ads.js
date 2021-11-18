const _ = require('lodash');
const debug = require('debug')('routes:ads');
const nconf = require('nconf');

const params = require('../lib/params');
const mongo3 = require('../lib/mongo3');

function aggregationCount(collection) {
    /* this function is invoked at the end and group/count
     * the sponsoredName */
    const protorv = _.groupBy(collection, function(e) {
        return _.toLower(
            _.endsWith(e.sponsoredSite, '/') ?
                e.sponsoredSite.replace(/\/$/, '') :
                e.sponsoredSite
            );
    });
    return _.map(protorv, function(listOf, sponsoredSite) {
        return {
            /* not all the ad have a sponsoredName */
            sponsoredName: _.reduce(listOf, function(memo, ade) {
                return memo ? memo : ade.sponsoredName
            }, null),
            sponsoredSite,
            count: listOf.length,
        }
    })
}

async function perVideo(req) {
    const videoId = params.getVideoId(req, 'videoId');
    const filter = { videoId };
    const adlist = await advertisingViaMetadata(filter);
    debug("ads by Video (%o), selected results %d", filter, adlist.length);
    return { json: aggregationCount(x) };
}

async function perChannel(req) {
    const channelId = params.getString(req, 'channelId');
    const startDate = params.getString(req, 'sdate');
    const endtDate = params.getString(req, 'edate');

    const filter = {
        'authorSource': { "$in": [
            "/channel/" + channelId,
            "/c/" + channelId
        ]}
    };
    try {
        filter.savingTime = {
            "$lte": new Date(startDate),
            "$gte": new Date(endtDate)
        }

        if(!!filter.savingTime["$lte"].valueOf())
            throw new Error("Invalid 'since-' Date " + startDate);
        if(!!filter.savingTime["$gte"].valueOf())
            throw new Error("Invalid 'till-' Date " + endtDate);

    } catch(error) {
        /* The error appears as Date("Invalid Date") and
           .valueOf returns NaN */
        return { json: {
            error: true,
            message: "Error in date format, expected YYYY-MM-DD: " + error.message
        }}
    }
    const adlist = await advertisingViaMetadata(filter);
    debug("ads by Channel (%o), selected results %d", filter, adlist.length);
    return { json: aggregationCount(adlist) };
}

async function advertisingViaMetadata(filter) {
    /* the logic is otherway around compared to the function
     * 'unbound'. We initially pick from metadata and then lookup to
     * ad. this impact the filtering/map function below */
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const r = await mongo3.aggregate(mongoc,
        nconf.get('schema').metadata, [
            { $sort: { savingTime: -1} },
            { $match: filter },
            { $limit: 1000 },
            { $lookup: {
                from: 'ads', foreignField: 'metadataId',
                localField: 'id', as: 'ad' }
            }
        ]);

    debug("looking for metadata by Channel (%j) found %d matches, hardcoded 400 max",
        filter, r.length);

    await mongoc.close();

    /* because 'ad' is a list with 0 or more AD associated,
     * we need _.compact to remove the absent and then _.flatten */
    return _.flatten(_.compact(_.map(r, function(metaret) {
        return _.map(metaret.ad, function(ad) {
            return {
                ..._.pick(ad,
                    ['sponsoredName', 'sponsoredSite', 'selectorName']),
                ..._.pick(metaret,
                    ['href', 'authorName', 'authorSource', 'title', 'savingTime'])
            };
        });
    })));
}

async function unbound(req) {
    const max = params.getInt(req, 'amount', 400);
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const r = await mongo3.aggregate(mongoc,
        nconf.get('schema').ads, [
            { $sort: { savingTime: -1} },
            { $limit: max },
            { $lookup: {
                from: 'metadata', foreignField: 'id',
                localField: 'metadataId', as: 'metadata' }
            }
        ])
    debug("unbound with max %d returns %d", max, r.length);
    await mongoc.close();

    /* this is the opposite logic of the function above, because
       we are quering by ads */
    const x = _.compact(_.map(r, function(adret) {
        const rv = _.pick(adret, 
            ['href', 'selectorName', 'sponsoredName', 'sponsoredSite', 'savingTime']
        );
        if(adret.metadata &&
           adret.metadata.length &&
           adret.metadata[0].type === 'video') {
            rv.authorName = adret.metadata[0].authorName;
            rv.authorSource = adret.metadata[0].authorSource;
            rv.videoTitle = adret.metadata[0].title;
        } else 
            return null;
        return rv;
    }));

    return { json: agggregationCount(x) };
}

module.exports = {
    perVideo,
    perChannel,
    unbound,
};
