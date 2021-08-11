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

    const answer = await mongo3.readOne(mongoc, nconf.get('schema').answers, { sessionId });
    let cumulated = answer ? answer : { sessionId };
    cumulated.reference = _.get(req.body, 'reference.from');
    cumulated.lastUpdate = new Date();

    /* keep only the most recent update that is not invalidating existing answers */
    cumulated = _.reduce(req.body.textColl, function(memo, textEntry) {
        if(textEntry.value.length < 2)
            return memo;
        const questionId = textEntry.id;
        memo[questionId] = textEntry.value;
        return memo;
    }, cumulated);
    cumulated = _.reduce(req.body.slidersColl, function(memo, sliderEntry) {
        if(sliderEntry.value === 50)
            return memo;
        const questionId = sliderEntry.id;
        memo[questionId] = sliderEntry.value;
        return memo;
    }, cumulated)
    cumulated = _.reduce(req.body.radio, function(memo, radioEntry) {
        const questionId = radioEntry.id;
        memo[questionId] = radioEntry.value;
        return memo;
    }, cumulated);

    await mongo3.deleteMany(mongoc, nconf.get('schema').answers, { sessionId })
    const result = await mongo3.writeOne(mongoc, nconf.get('schema').answers, cumulated);
    return { json: { accumulating: cumulated, res: result.result } };
};

async function retrieveAnswers(req) {

    if(!security.checkPassword(req))
        return {json: { error: true, message: "Invalid key" }};

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const answers = await mongo3.read(mongoc, nconf.get('schema').answers, {}, { lastUpdate: 1});
    await mongoc.close();

    const revisited = _.map(_.reverse(answers), function(ans) {
        // add a calculation on how have been populated by contributors
        ans.fifth = []
        _.each(answerMap, function(answerExpected, stepNumber) {
            // when at least one answer from a panel has value, we count the step as done
            if(_.intersection(answerExpected, _.keys(ans)).length)
                ans.fifth.push(stepNumber +1);
        });
        return cleanAnswerFromDB(ans);
    })
    return {json: revisited}
};

const answerMap = [
    ["11", "12", "13", "14", "15", "16", "15", "18", "19"],
    ["21", "22", "23", "24", "25", "26", "27"],
    ["31", "32", "33", "34", "35", "36" ],
    ["41", "42" , "optIn" ]
]

function cleanAnswerFromDB(ans) {
    _.unset(ans, '_id');
    // optIn has now a different consistency than boolean
    if(ans.optIn)
        ans.optIn = "YES";
    else
        _.unset(ans, 'optIn');
    return ans;
}

async function retrieveAnswersCSV(req, res) {
    if(!security.checkPassword(req))
        return {json: { error: true, message: "Invalid key" }};
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const answers = await mongo3.read(mongoc, nconf.get('schema').answers, {}, { lastUpdate: 1});
    await mongoc.close();
    const csvcontent = csv.produceCSVv1(_.map(answers, cleanAnswerFromDB), _.concat(
        [ "sessionId", "lastUpdate", "reference" ],
        _.flatten(answerMap),
    ));
    const filename = `answers-size-${answers.length}.csv`;
    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csvcontent
    }
};

async function deleteAnswer(req, res) {
};

module.exports = {
    recordAnswers,
    retrieveAnswers,
    retrieveAnswersCSV,
    deleteAnswer,
};
