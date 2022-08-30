#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('wetest-1-pseudonymous —');
const nconf = require('nconf');
const fs = require('fs');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('@shared/providers/mongo.provider');

nconf.argv().env().file({ file: 'config/settings.json' });

/* static settings of weTEST#1 */
const testVideos = [{
    "href": "https://www.youtube.com/watch?v=Lo_m_rKReyg",
    "videoId": "Lo_m_rKReyg",
    "language": "Chinese"
  }, {
    "href": "https://www.youtube.com/watch?v=Zh_SVHJGVHw",
    "videoId": "Zh_SVHJGVHw",
    "language": "Spanish"
  }, {
    "href": "https://www.youtube.com/watch?v=A2kiXc5XEdU",
    "videoId": "A2kiXc5XEdU",
    "language": "English"
  }, {
    "href": "https://www.youtube.com/watch?v=WEMpIQ30srI",
    "videoId": "WEMpIQ30srI",
    "language": "Porutuguese"
  }, {
    "href": "https://www.youtube.com/watch?v=BNdW_6TgxH0",
    "videoId": "BNdW_6TgxH0",
    "language": "Arabic"
  },
];
const timefilter = {
    'savingTime': {
        "$gte": new Date('2020-03-25 00:00:00'),
        "$lte": new Date('2020-03-27 00:00:00')
    }
};

async function pickFromDB(filter, sorting) {
    const mongoc = await mongo3.clientConnect();
    const rv = await mongo3.read(mongoc, nconf.get('schema').metadata, filter, sorting);
    await mongoc.close();
    debug("Completed DB access to fetch: %j: %d objects retrived", filter, _.size(rv));
    return rv;
}

async function getpseudos(key, tf) {
    const we1pseudonyn = utils.string2Food(key + "weTest#1");
    const norpseudonyn = utils.string2Food(key);
    debug("Pseudonym for %s\nCommon:\t%s\nweTest#1\t%s", key, norpseudonyn, we1pseudonyn);

    const contribs = await pickFromDB(_.extend(tf, { publicKey: key }), { clientTime: -1 });
    const simpled = _.map(contribs, function(e) {
        e.day = moment(e.clientTime).format("YYYY-MM-DD");
        e.hour = moment(e.clientTime).format("ddd-HH:mm");
        e.wetest = _.find(testVideos, { href: e.href }) ? true : false;
        return _.pick(e, [ 'wetest', 'title', 'login', 'type', 'day', 'hour', 'clientTime', 'href' ]);
    });
    const dyz = _.groupBy(simpled, 'day');
    console.log("From htmls:");
    _.each(dyz, function(dataday, daystr) {
        debug("%s", daystr);
        _.each(_.orderBy(dataday, 'clientTime'), function(sam) {
            debug("\t(we) %s\tLogin %s\t[%s]\t%s\t%s", sam.wetest, sam.login, sam.type, sam.hour, sam.title);
        })
    });
}

/* -------------------------------------- execution handler --------------------------------------- */
try {
    const key = nconf.get('key');
    if(!key) {
        console.log(`This script need --key and return pseudonyms and infos`);
        process.exit(1);
    }
    getpseudos(key, timefilter);
} catch(e) {
    console.log("Error in the main function!", e.message);
}
