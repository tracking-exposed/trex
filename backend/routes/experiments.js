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

async function sharedDataPull(experiment) {
    debug("Requested experimentId %s", experiment);

    const MAX = 3000;
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const metadata = await mongo3
        .readLimit(mongoc, nconf.get('schema').metadata,
        { experiment }, { savingTime: -1 }, MAX, 0);
    await mongoc.close();

    debug("Returning %d available data by experiment %s (max %d) %j",
        metadata.length, experiment, MAX, _.countBy(metadata, 'type'));
}

async function json(req) {
    const experiment = params.getString(req, 'experimentId', true);
    const metadata = await sharedDataPull(experiment);
    return { json: metadata}
}

/*
    return _.map(results, function(r) {
        // r is a metadata with only one related, duplicated as many related avail.
        const chardetoutp = chardet.analyse(Buffer.from(r.related.recommendedTitle));
        return {
            savingTime: r.savingTime,
            metadataId: r.id,
            blang: r.blang,
            watcher: utils.string2Food(r.publicKey),
            // publicKey: l.publicKey,
            profile: r.experiment.profile,
            experiment: name,
            videoName: r.experiment.videoName,
            session: r.experiment.session,
            watchFor: "" + r.experiment.watchingTime,

            recommendedVideoId: r.related.videoId,
            recommendedPubtime: r.related.publicationTime ? r.publicationTime.toISOString() : "Invalid Date",
            recommendedReltiveS: r.related.recommendedRelativeSeconds,
            recommendedTitle: r.related.recommendedTitle,
            recommendedTitleCharset: chardetoutp[0].name,
            recommendedTitleLang: chardetoutp[0].lang || "unknown",
            recommendedAuthor: r.related.recommendedSource,
            // recommendedVerified: r.verified,
            recommendationOrder: r.related.index,
            recommendedViews: r.related.recommendedViews,
            isTop20: !!(r.related.index <= 20),

            thumbnail: "https://i.ytimg.com/vi/" + r.related.videoId + "/mqdefault.jpg",
            watchedId: r.videoId,
            watchedAuthor: r.authorName,
            // watchedPubtime: r.publicationTime ? r.publicationTime.toISOString() : "Invalid Date",
            watchedTitle: r.title,
            // watchedChannel: r.authorSource,
        };
*/

async function csv(req) {

    const textcsv = CSV.produceCSVv1(related);
    debug("Requested experiment %s, fetch %d related, and converted in a %d CSV",
        expname, _.size(related), _.size(textcsv));
    const filename = expname + '-' + _.size(related) + '.csv';
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

    /* TODO aggregate pipeline,
     * to count number of usage and last samples collected */
    /* TODO consider to do a count of .experiments to know how many 
     * are still in progress, and which are in progress */

    const result = await mongo3
        .readLimit(mongoc, nconf.get('schema').directives,
        filter, { when: -1 }, MAX, 0);
    await mongoc.close();

    debug("Returning %d available directives on type %s (max %d)",
        result.length, type, MAX);

    return {
        json: _.map(result, function(r) {
            r.humanizedWhen = moment(r.when).format("YYYY-MM-DD");
            return _.omit(r, ['_id', 'directiveType'])
        })
    };
}

async function guardoniGenerate(req) {
    const experiment = req.params.experiment;
    const botname = req.params.botname;
    const guardobj = await automo.getGuardoni({
        experiment,
        botname
    });
    const guardonified = _.map(guardobj[0].urls, function(url, index, total) {
        return {
            name: `${experiment}__${botname} video ${index+1} of ${total.length}`,
            watchFor: '5m',
            loadFor: 3000,
            url,
            experiment,
        }
    }) 
    debug("guardoniGenerate for %s (%s) produced %d", experiment, botname, _.size(guardonified));
    return { json: guardonified };
}

async function guardoniConfigure(req) {
    // parameters: experiment + botname
    const experiment = req.params.experiment;
    const botname = req.params.botname;
    const urls = req.body;
    // remind self, urls.experiment and urls.botname aren't checked
    const guardobj = {
        urls : _.filter(urls.urls, 'length'),
        experiment,
        botname,
        when: new Date(),
    }
    debug("Guardoni saving in progress %j", guardobj);
    const retval = await automo.saveGuardoni(guardobj);
    return { json: retval };
}

async function legacyGuardoni(req) {
    // TODO kill for the new directive things

    // const cat = req.params.category;
    const wtime = req.params.time;
    const fcontent = fs.readFileSync("config/expercont.json", "utf8");
    const vlist = JSON.parse(fcontent);
    console.trace("This shouldn't be used, right?", wtime, vlist);

    /*  GUARDONI format:
     *    "name": "Tracking Exposed intro video",
     *    "url": "https://www.youtube.com/watch?v=SmYuYEhT81c",
     *    "watchFor": "end",
     *    "loadFor": 2000
     */
    /*
    const keys = _.uniq(_.map(vlist, function(ventry) {
        return ventry[0]
    }));
    if(keys.indexOf(cat) === -1)
        return { json: [ "Invalid requested category name. allowed:", keys]};
    */

    const guardonified = _.reduce(vlist, function(memo, ventry) {
        const thisc = ventry[0];
        const url = ventry[1];
        // memo.seen[thisc] = memo.seen[thisc] ? memo.seen[thisc] + 1 : 1;

        if(thisc === "first")
            memo.first.push({
                name: 'first',
                url,
                watchFor: 15000,
                loadFor: 8000
            });
        else if(thisc === "last")
            memo.last.push({
                name: 'last',
                url,
                watchFor: 15000,
                loadFor: 8000
            });
        else {
            memo.selected.push({
                name: thisc,
                watchFor: wtime === "end" ? "end" : wtime,
                loadFor: 8000,
                url
            })
        }

        /*
        if(thisc == cat) {
            if(!memo.second.length)
                memo.second.push({
                    name: cat+'-first', url,
                    watchFor: 'end', loadFor: 8000
                })
            else
                memo.selected.push({
                    name: cat+'-'+memo.seen[cat], url,
                    watchFor: 'end', loadFor: 8000
                })
        }
        else {
            memo.others.push({
                name: thisc+'-'+memo.seen[thisc], url,
                watchFor: 18000, loadFor: 8000
            });
        } */

        return memo;
    }, {
        first: [],
        last: [],
        second: [],
        selected: [],
        others: [],
        seen: {},
    });

    /*
    const shuffled = _.reduce(_.concat(guardonified.others, guardonified.selected), function(memo, guarv) {
        // poor randomizer but ..
        const x = _.random(0, memo.length || 1) % 3;
        if(x == 0)
            return _.concat(guarv, memo);
        else if(x==1) {
            memo.push(guarv);
            return memo;
        } else {
            const half = _.round(memo.length / 2);
            const chunks = _.chunk(memo, half)
            return _.concat(_.reverse(chunks[1]), guarv, _.reverse(chunks[0]));
        }
    }, []);
    */

    const retval = [
        ...guardonified.first,
        ...guardonified.selected,
        ...guardonified.last,
    ];
    return { json: retval };
}

async function opening(req) {
    throw new Error("Not implement yet");
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
    csv,
    dot,
    json,
    list,
    legacyGuardoni,
    guardoniConfigure,
    guardoniGenerate,

    opening,
    channel3,
    conclude3,
};
