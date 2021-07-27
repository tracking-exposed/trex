const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:answers');
const nconf = require('nconf');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');
const security = require('../lib/security');

async function recordAnswers(req) {

    debug(req.body);

    const payload = {
        when: new Date(),
        ...body,
    };
    console.log(payload);
    throw new Error("Not implemented");
    return { json: payload };
};

async function retrieveAnswers(req, res) {

    if(!security.checkPassword(req))
        return {json: { error: true, message: "Invalid key" }};

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const answers = await mongo3.read(mongoc, nconf.get('schema').answers, {}, { when: 1});

    await mongoc.close();
    const revisited = _.map(answers, function(a) {
    })
    return {json: answers}
}

async function retrieveAnswersCSV(req, res) {
    return { text: csv };
}

module.exports = {
    recordAnswers,
    retrieveAnswers,
    retrieveAnswersCSV,
};
