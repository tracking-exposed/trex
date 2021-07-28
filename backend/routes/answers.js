const _ = require('lodash');
const debug = require('debug')('routes:answers');
const nconf = require('nconf');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');
const security = require('../lib/security');

async function recordAnswers(req) {

    const sessionId = utils.hash({ randomSeed: req.body.sessionId })
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const answer = await mongo3.readOne(mongoc, nconf.get('schema').answers, { sessionId }, { when: 1});

    debug(answer);

    let accumulating = answer ? answer : { sessionId };
    accumulating.lastUpdate = new Date();

    /* keep only the most recent update that is not invalidating existing answers */
    accumulating = _.reduce(req.body.textColl, function(memo, textEntry) {
        if(textEntry.value.length < 2)
            return memo;
        const questionId = textEntry.id;
        memo[questionId] = textEntry.value;
        return memo;
    }, accumulating);

    accumulating = _.reduce(req.body.slidersColl, function(memo, sliderEntry) {
        if(sliderEntry.value === 50)
            return memo;
        const questionId = sliderEntry.id;
        memo[questionId] = sliderEntry.value;
        return memo;
    }, accumulating)

    console.log(accumulating);
    const result = await mongo3.updateOne(mongoc, nconf.get('schema').answers, { sessionId }, accumulating)
    return { json: accumulating };
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
};

async function retrieveAnswersCSV(req, res) {
    return { text: csv };
};

async function deleteAnswer(req, res) {
};

module.exports = {
    recordAnswers,
    retrieveAnswers,
    retrieveAnswersCSV,
    deleteAnswer,
};
