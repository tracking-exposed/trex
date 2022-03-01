#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('routes:research');
const nconf = require('nconf');
const mongo3 = require('../lib/mongo3');
const fs = require('fs');

nconf.env().argv().file({file: 'config/settings.json'});

async function produceHomeStats(filename) {

    const filter = nconf.get('d') ? { type: 'home', id: nconf.get('d') } : { type: 'home' };
    debug("filter by: %j", filter);
    const pipeline = [
        { "$match": filter },
        { "$project": { "publicKey": true, "sections.display": true, "savingTime": true }},
        { "$group": {
            _id: "$publicKey",
            contributions: { "$sum": 1 },
            names: { "$push": "$sections.display" },
        }},
        { "$unwind": "$names" } 
    ];
    const mongoc = await mongo3.clientConnect({concurrency: 10});
    debug("Sending pipeline to mongodb...");
    const c = await mongo3.aggregate(mongoc, nconf.get('schema').metadata, pipeline);
    debug("From DB retrieved %d objs", _.size(c));
    const rv = _.map(c, function(e) {
        e.amount = _.size(e.names);
        e.l = e.names.join('——');
        e.pk = e._id;
        _.unset(e, 'names');
        _.unset(e, '_id');
        return e;
    });
    if(nconf.get('d')) {
        console.log(JSON.stringify(rv, undefined, 2));
    } else {
        debug("summary ready for saving")
        fs.writeFileSync(filename + '.json', JSON.stringify(rv, undefined, 2));
        debug("Produced %s.json", filename);
    }
    await mongoc.close();
}

function attributeRole(section) {
    if(section.order == 0)
        return 'hot-national';
    if(section.order == 1)
        return 'top-national';
    if(section.order == 2) {
        if(section.href == '/recommended')
            return 'Recommended';
        else
            return 'Anomaly';
    }
    if(section.display.match(/\ -\ /) )
        return 'Recommended Category';

    if(section.display.match(/XXX/))
        return 'XXX Featured';
    
    return 'Not-Guessed';
}

async function consistencyViews(filename) {

    const filter = nconf.get('d') ? { type: 'home', id: nconf.get('d') } : { type: 'home' };
    debug("filter by: %j", filter);
    const pipeline = [
        { "$match": filter },
        { "$project": { "sections": true, "savingTime": true }}
    ];
    const mongoc = await mongo3.clientConnect({concurrency: 10});
    debug("Sending pipeline to mongodb...");
    const c = await mongo3.aggregate(mongoc, nconf.get('schema').metadata, pipeline);
    debug("From DB retrieved %d objs", _.size(c));
    const rv = _.reduce(c, function(memo, e) {
        _.each(e.sections, function(section) {
            if(!_.isNull(section)) {
                _.each(section.videos, function(video) {
                    memo.push({
                        videoId: video.videoId,
                        sectionName: section.display,
                        views: video.views,
                        value: video.value,
                        when: e.savingTime
                    })
                })
            }
        })
        return memo;
    }, []);
    if(nconf.get('d')) {
        console.log(JSON.stringify(rv, undefined, 2));
    } else {
        debug("views consistency ready for saving")
        fs.writeFileSync(filename + '.json', JSON.stringify(rv, undefined, 2));
        debug("Produced %s.json", filename);
    }
    await mongoc.close();
}

async function produceHomeSummary(filename) {

    const filter = nconf.get('d') ? { type: 'home', id: nconf.get('d') } : { type: 'home' };
    debug("filter by: %j", filter);
    const pipeline = [
        { "$match": filter },
        { "$project": { "publicKey": true, "sections": true, "savingTime": true }}
    ];
    const mongoc = await mongo3.clientConnect({concurrency: 10});
    debug("Sending pipeline to mongodb...");
    const c = await mongo3.aggregate(mongoc, nconf.get('schema').metadata, pipeline);
    debug("From DB retrieved %d objs", _.size(c));
    const rv = _.reduce(c, function(memo, e) {
        _.each(e.sections, function(section) {
            if(!_.isNull(section))
                memo.push({
                    name: section.display,
                    role: attributeRole(section),
                    pk: e.publicKey,
                    savingTime: e.savingTime,
                    order: section.order +1,
                });
        })
        return memo;
    }, []);
    if(nconf.get('d')) {
        console.log(JSON.stringify(rv, undefined, 2));
    } else {
        debug("summary ready for saving")
        fs.writeFileSync(filename + '.json', JSON.stringify(rv, undefined, 2));
        debug("Produced %s.json", filename);
    }
    await mongoc.close();
}

(async function() {
    // await produceHomeStats('homestats');
    await produceHomeSummary('homesummary');
    await consistencyViews('consinstency');
})();
