const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:experiments');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');

const automo = require('../lib/automo');
const params = require('../lib/params');
const CSV = require('../lib/CSV');

function getVideoId(videol) {
    const urlinfo = url.parse(videol.url);
    const p = querystring.parse(urlinfo.query);
    return p.v;
}

async function submission(req) {
    const experiment = {
        name: req.body.experiment,
        profile: req.body.profile,
        videos: _.map(req.body.videos, getVideoId),
        descriptions: _.map(req.body.videos, 'name'),
        publicKey: req.body.publicKey,
        testTime: new Date(req.body.when)
    };
    debug("experiment submission received!", experiment);
    const retval = await automo.saveExperiment(experiment);
    return { json: retval };
};

function dotify(data) {
    const dot = Object({links: [], nodes: []})
    dot.links = _.map(data, function(video) {
        return {
            target:
                video.profile + '--' +
                video.expnumber + '--' +
                moment(video.savingTime).format("dddd"),
            source: video.recommendedVideoId,
            value: 1
        } });
    const vList = _.uniq(_.map(data, function(video) { return video.recommendedVideoId }));
    const videoObject = _.map(vList, function(v) { return { id: v, group: 1 }});
    const pList = _.uniq(_.map(data, function(video) {
        return video.profile + '--' +
               video.expnumber + '--' +
               moment(video.savingTime).format("dddd")
    }));
    const pseudoObject = _.map(pList, function(v) { return { id: v, group: 2 }});
    dot.nodes = _.concat(videoObject, pseudoObject);
    return dot;
}

async function dot(req) {
    const expname = params.getString(req, 'expname', true);
    const related = await automo.fetchExperimentData(expname);
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

async function json(req) {
    const expname = params.getString(req, 'expname', true);
    const related = await automo.fetchExperimentData(expname);
    // this return data that are already the mixture between
    // collection 'metadata' and 'experiments'
    debug("Requested experiment %s, fetch %d related",
        expname, _.size(related));
    return { json: related }
}

async function csv(req) {
    const expname = params.getString(req, 'expname', true);
    const related = await automo.fetchExperimentData(expname);
    // this return data that are already the mixture between
    // collection 'metadata' and 'experiments'
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
    return { json: [
        "SpaceScience,CyberPunk2077,IndianFood (DashCam first and last)",
        "https://github.com/tracking-exposed/yttrex/blob/master/backend/config/expercont.json" ]
    };
}

async function guardoni(req) {

    const cat = req.params.category;

    const fcontent = fs.readFileSync("config/expercont.json", "utf8");
    const vlist = JSON.parse(fcontent);
    /*  GUARDONI format:
     *    "name": "Tracking Exposed intro video",
     *    "url": "https://www.youtube.com/watch?v=SmYuYEhT81c",
     *    "watchFor": "end",
     *    "loadFor": 2000
     */
    const keys = _.uniq(_.map(vlist, function(ventry) {
        return ventry[0]
    }));

    if(keys.indexOf(cat) === -1)
        return { json: [ "Invalid requested category name. allowed:", keys]};

    const guardonified = _.reduce(vlist, function(memo, ventry) {
        const thisc = ventry[0];
        const url = ventry[1];
        memo.seen[thisc] = memo.seen[thisc] ? memo.seen[thisc] + 1 : 1;

        if(thisc == "DashCam") {
            if(!memo.first.length)
                memo.first.push({
                    name: 'DashCam-1',
                    url,
                    watchFor: 24000,
                    loadFor: 8000
                });
            else if(!memo.last.length)
                memo.last.push({
                    name: 'DashCam-final',
                    url,
                    watchFor: 24000,
                    loadFor: 8000
                });
        }
        else if(thisc == cat) {
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
        }
        return memo;
    }, {
        first: [],
        last: [],
        second: [],
        selected: [],
        others: [],
        seen: {},
    });

    const shuffled = _.reduce(_.concat(guardonified.others, guardonified.selected), function(memo, guarv) {
        /* poor randomizer but .. */
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

    const retval = [
        ...guardonified.first,
        ...guardonified.second,
        ...shuffled,
        ...guardonified.last,
    ];
    return { json: retval };
}

module.exports = {
    submission,
    csv,
    dot,
    json,
    list,
    guardoni,
};
