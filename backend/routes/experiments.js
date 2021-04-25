const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:experiments');
const url = require('url');
const querystring = require('querystring');

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

module.exports = {
    submission,
    csv
};