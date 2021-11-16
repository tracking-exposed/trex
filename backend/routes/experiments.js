const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:experiments');
const fs = require('fs');
const nconf = require('nconf');

const automo = require('../lib/automo');
const params = require('../lib/params');
const CSV = require('../lib/CSV');
const mongo3 = require('../lib/mongo3');

function dotify(data) {
    const dot = Object({links: [], nodes: []})
    dot.links = _.map(data, function(video) {
        return {
            target:
                video.profile + '—' +
                video.expnumber + '—' +
                moment(video.savingTime).format("dddd"),
            source: video.recommendedVideoId,
            value: 1
        } });
    const vList = _.uniq(_.map(data, function(video) { return video.recommendedVideoId }));
    const videoObject = _.map(vList, function(v) { return { id: v, group: 1 }});
    const pList = _.uniq(_.map(data, function(video) {
        return video.profile + '—' +
               video.expnumber + '—' +
               moment(video.savingTime).format("dddd")
    }));
    const pseudoObject = _.map(pList, function(v) { return { id: v, group: 2 }});
    dot.nodes = _.concat(videoObject, pseudoObject);
    return dot;
}

async function dot(req) {

    const experiment = params.getString(req, 'experimentId', true);
    const metadata = await sharedDataPull(experiment);

    throw new Error("Remind this can't work because metadata has many type");
    if(!_.size(related))
        return { json: {error: true, message: "No data found with such parameters"}}

    const grouped = _.groupBy(related, 'videoName');
    const dotchain = _.map(grouped, function(vidlist, videoName) {
        return {
            videoName,
            dotted: dotify(vidlist)
        };
    })
    return { json: dotchain };
}

async function sharedDataPull(filter) {
    const MAX = 3000;
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const metadata = await mongo3
        .readLimit(mongoc, nconf.get('schema').metadata,
        filter, { savingTime: -1 }, MAX, 0);
    await mongoc.close();

    debug("Found %d available data by filter %o (max %d) %j",
        metadata.length, filter, MAX, _.countBy(metadata, 'type'));
    return metadata;
}

async function json(req) {
    const experimentId = params.getString(req, 'experimentId', true);
    const metadata = await sharedDataPull({
        'experiment.experimentId': experimentId
    });
    return { json: metadata}
}


async function csv(req) {

    const type = req.params.type;
    if(CSV.allowedTypes.indexOf(type) === -1) {
        debug("Invalid requested data type? %s", type);
        return { text: "Error, invalid URL composed" };
    }

    const experimentId = params.getString(req, 'experimentId', true);
    const metadata = await sharedDataPull({
        'experiment.experimentId': experimentId, type
    });

    const transformed = CSV.unrollNested(metadata, {
        type, experiment: true, private: true
    });

    const textcsv = CSV.produceCSVv1(transformed);
    debug("Fetch %d metadata(s), and converted in a %d CSV",
        _.size(metadata), _.size(textcsv));

    const filename = `${experimentId.substr(0, 8)}-${type}-${transformed.length}.csv`;
    return {
        text: textcsv,
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        }
    }
};

async function list(req) {
    /* this function pull from the collection "directives"
     * and filter by returning only the 'comparison' kind of
     * experiment. This is imply req.params.type == 'comparison' */
    const MAX = 400;
    const type = req.params.directiveType;
    if(type !== 'comparison') {
        console.trace("not supported", req.params);
        return { text: "Not supported at the moment; "}
    }
    const filter = { directiveType: type };
    const mongoc = await mongo3.clientConnect({concurrency: 1});

    const configured = await mongo3
        .readLimit(mongoc, nconf.get('schema').directives,
        filter, { when: -1 }, MAX, 0);

    const active = await mongo3
        .readLimit(mongoc, nconf.get('schema').experiments,
        filter, { testTime: -1 }, MAX, 0);

    debug("Returning %d configured directives, %d active (type %s, max %d)",
        configured.length, active.length, type, MAX);

    const expIdList = _.map(configured, 'experimentId');
    const lastweek = await mongo3
        .readLimit(mongoc, nconf.get('schema').metadata, {
            "experiment.experimentId": { "$in": expIdList }
        }, { savingTime: -1}, MAX, 0);

    await mongoc.close();

    const infos = {};
    /* this is the return value, it would contain:
         .configured  (the directive list)
         .active      (eventually non-completed experiments)
         .recent      (activly marked metadata)
     */
    infos.configured = _.map(configured, function(r) {
        r.humanizedWhen = moment(r.when).format("YYYY-MM-DD");
        return _.omit(r, ['_id', 'directiveType'])
    });

    infos.active = _.compact(_.map(active, function(e) {
        if(e.status === 'completed')
            return null;
        _.unset(e, '_id');
        e.publicKey = e.publicKey.substr(0, 8);
        return e;
    }));

    infos.recent = _.reduce(_.groupBy(_.map(lastweek, function(e) {
         return {
             publicKey: e.publicKey.substr(0, 8),
             evidencetag: e.experiment.evidencetag,
             experimentId: e.experiment.experimentId
         }
    }), 'experimentId'), function(memo, listOf, experimentId) {
        memo[experimentId] = {
            contributions: _.countBy(listOf, 'evidencetag'),
            profiles: _.countBy(listOf, 'publicKey')
        };
        return memo;
    }, {});

    return {
        json: infos
    };
}

async function channel3(req) {
    // this is invoked as handshake, and might return information
    // helpful for the extension, about the experiment running.
    const experimentInfo = {
        publicKey: _.get(req.body, 'config.publicKey'),
        href: _.get(req.body, 'href'),
        experimentId: _.get(req.body, 'experimentId'),
        evidencetag: _.get(req.body, 'evidencetag'),
        execount: _.get(req.body, 'execount'),
        newProfile: _.get(req.body, 'newProfile'),
        testTime: new Date(_.get(req.body, 'when')) || undefined,
        directiveType: _.get(req.body, 'directiveType'),
    };
    const retval = await automo.saveExperiment(experimentInfo);

    /* this is the default answer, as normally there is not an
     * experiment running */
    if(_.isNull(retval))
        return { json: { experiment: false }};

    debug("Marked experiment %s as 'active' for %s",
        retval.experimentId, retval.publicKey);

    return { json: retval };
};

async function conclude3(req) {
    const testTime = req.params.testTime
    debug("Conclude3 received: %s", testTime);
    if(testTime.length < 10)
        return { status: 403 };

    const test = moment(testTime);
    if(!test.isValid)
        return { status: 403 };
    
    const retval = await automo.concludeExperiment(testTime);
    debug("ConcludedExperiment retval %j", retval);
    return { json: retval };
}

module.exports = {
    /* used by the webapps */
    csv,
    dot,
    json,
    list,

    /* used by the browser extension/guardoni */
    channel3,
    conclude3,
};
