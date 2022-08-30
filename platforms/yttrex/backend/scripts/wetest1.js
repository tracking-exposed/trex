#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('scripts:wetest-1-producer');
const begin = require('debug')('new contributor input:');
const nconf = require('nconf');
const fs = require('fs');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('@shared/providers/mongo.provider');

nconf.argv().env().file({ file: 'config/settings.json' });

async function findPlausibleContributor(urlList, filter) {
    /* this function do a distinct of all the publicKey which contributed
     * to the necessary URL, and return a list of potential contributors */
    const mongoc = await mongo3.clientConnect();

    let partialf = _.partial(_.intersection);
    let metadataIds = [];
    for (url of urlList) {
        filter.href = url;
        let k = await mongo3.distinct(mongoc, nconf.get('schema').htmls, 'publicKey', filter);
        debug("by checking htmls per href %s: %d potential contributors", url, _.size(k));
        partialf = _.partial(partialf, k);

        let m = await mongo3.distinct(mongoc, nconf.get('schema').htmls, 'metadataId', filter);
	metadataIds.push(m);
    }

    console.log(JSON.stringify(_.flatten(metadataIds), undefined, 2));

    await mongoc.close();
    _.unset(filter, 'href');
    return partialf();
}

async function extractContributions(keys, urlSeq, filter) {

    const mongoc = await mongo3.clientConnect();
    const treasure = [];
    for (key of keys) {
        filter.publicKey = key;
        let evidences = await mongo3.read(mongoc, nconf.get('schema').metadata, filter, { savingTime: -1});
        if(_.size(evidences)) {
            begin("processing %d evidence [%s] ",
                _.size(evidences), 
                moment.duration(
                    moment(_.first(evidences).savingTime) -
                    moment(_.last(evidences).savingTime)
                ).humanize()
            );
            treasure.push(mineSequence(evidences, urlSeq));
        } else
            begin("Excluded contributor (no metadata)");
    }

    await mongoc.close();

    debug("after DB and sequence mining, treasure is %d -> %d -> %d", 
        _.size(treasure), _.size(_.flatten(treasure)),
        _.size(_.flatten(_.flatten(treasure)))
    );

    const retval = _.map(_.flatten(_.flatten(treasure)),
        function(n) {
            if(!_.startsWith(n.thumbnail, 'http'))
                _.unset(n, 'thumbnail');
            return _.omit(n, ['id', 'thumbnails' ]);
        });

    const jsonfeatures = _.uniq(_.flatten(_.map(retval, function(evid) {
            return _.map(evid, function(v, k) {
                return k;
            })
        })
    ));

    debug(jsonfeatures);
    const first = _.reduce(jsonfeatures, function(memo, kname) {
        _.set(memo, kname, _.get(_.first(retval), kname, ""));
        return memo;
    }, {});
    /* this is because the CSV generate a number of keys in the first 
     * row, as much as there are in the first object. so we extend the 
     * retval[0] with all the keys, to be sure a default "" whould be there */
    _.set(retval, 0, first);
    return retval;
}

function transformSequence(partial, sessionNumber) {

    return _.map(partial, function(selectedNode, step) {
        selectedNode.step = step;
        selectedNode.session = sessionNumber;
        selectedNode.pseudo = utils.string2Food(selectedNode.publicKey);
        selectedNode = _.omit(selectedNode, ['publicKey', '_id' ]);
        debugger;

        let nodes = []
        if(selectedNode.type == 'video' ) {
            _.each(selectedNode.related, function(r, order) {
                let unwind = _.extend(r, 
                    selectedNode.producer,
                    _.omit(selectedNode, ['related', 'href', 'title', 'categories', 'views', 'videoId', 'producer']));
                debugger;
                unwind.displayOrder = order;
                unwind.watchedTitle = selectedNode.title;
                unwind.watchedVideoId = selectedNode.videoId;

                nodes.push(unwind);
            });
        }

        if(selectedNode.type == 'home') {
            _.each(_.filter(selectedNode.sections, null), function(s) {
                _.each(s.videos, function(v, videoOrder) {
                    let unwind = _.extend(v, 
                        _.omit(selectedNode, ['sections', 'href']));
                    unwind.sectionName = s.display;
                    unwind.sectionHref = s.href;
                    unwind.sectionOrder = s.order;
                    unwind.displayOrder = videoOrder;
                    nodes.push(unwind);
                })
            })
        }
        return nodes;
    });
}

function mineSequence(s, urlSeq) {
    const ready = _.reduce(s, function(memo, node) {
        debugger;
        if(node.href == urlSeq[memo.counter]) {
            memo.partial.push(node);
            memo.counter++;
        } else {
            /* debug("not-a-match at position %d collected %d | is [%s] should %s", memo.counter, 
                _.size(memo.partial), node.href, urlSeq[memo.counter]) 
               we're not killing this session, but it could be */
        }
        if(memo.counter  == _.size(urlSeq)) {
            /* here we save the list of evidence, and transform them 
             * on our needs */
            const sequences = transformSequence(memo.partial, memo.session);
            memo.final.push(sequences);
            memo.session++;
            memo.counter = 0;
            memo.partial = [];
        }
        return memo;
    }, { final: [], partial: [], counter: 0, session: 1});

    debug("   + %d (partial %d) counter left at %d session %d session size: %d",
        _.size(ready.final), _.size(ready.partial), ready.counter, ready.session, _.size(s));

    if(!_.size(ready.final))
        return [];

    return _.flatten(_.flatten(ready.final));
}

const WETEST_VERSION = 8;
const potcfg = {
    sequence: [
        'https://www.youtube.com/',
        'https://www.youtube.com/watch?v=Lo_m_rKReyg',
        'https://www.youtube.com/watch?v=Zh_SVHJGVHw',
        'https://www.youtube.com/watch?v=A2kiXc5XEdU',
        'https://www.youtube.com/watch?v=WEMpIQ30srI',
        'https://www.youtube.com/watch?v=BNdW_6TgxH0',
        'https://www.youtube.com/'
    ],
    timefilter: {
        'savingTime': {
            "$gte": new Date('2020-03-25 00:00:00'),
            "$lte": new Date('2020-03-27 00:00:00')
        }
    },
    home: 'wetest-home-' + WETEST_VERSION,
    video: 'wetest-video-' + WETEST_VERSION,
};

async function main() {
    debug("Extracting content for wetest #%d: %s",
        WETEST_VERSION, JSON.stringify(potcfg, undefined, 2));
    const keys = await findPlausibleContributor(
        _.uniq(potcfg.sequence), potcfg.timefilter);
    debug("Found %d plausible contributors", _.size(keys));

    const result = await extractContributions(keys, potcfg.sequence, potcfg.timefilter);
    debug("Extracted %d complete sequences, splitting by 'home' and 'video'…", _.size(result));

    const home = _.filter(result, { type: 'home' });
    const video = _.filter(result, { type: 'video' });

    fs.writeFileSync(potcfg.outputf + '.json', JSON.stringify(result, undefined, 2));

    const csvtext = csv.produceCSVv1(result);
    debug("Produced %d bytes", _.size(csvtext));
    fs.writeFileSync(potcfg.outputf + '.csv', csvtext);
}

try {
    console.log("Starting extraction of id from wetest1…");
    main();
} catch(e) {
    console.log("Error in main()", e.message);
}
