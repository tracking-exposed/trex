const _ = require('lodash');
const nconf = require('nconf');
const moment = require('moment');
const debug = require('debug')('routes:answers');

const csv = require('../lib/CSV');
const utils = require('../lib/utils');
const mongo3 = require('../lib/mongo3');
const security = require('../lib/security');

const allowqnames = ['watchers', 'youtubers'];

function cleanAnswerFromDB(ans) {
    _.unset(ans, '_id');
    ans.timeago = moment.duration(moment(ans.lastUpdate) - moment()).humanize(true);
    return ans;
}

async function recordAnswers(req) {
    const sessionId = utils.hash({ randomSeed: req.body.sessionId })
    const qName = req.body.qName;
    const version = 1;

    if(allowqnames.indexOf(qName) === -1)
        throw new Error("Invalid Questionnaire requested")

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const answer = await mongo3.readOne(mongoc, nconf.get('schema').answers, {
        sessionId,
        qName,
        version
    });

    /* when unzip dictionary the latter key has priority */
    let cumulated = {
        reference: _.get(req.body, 'reference.from'),
        qName,
        version,
        ...answer,
        lastUpdate: new Date(),
    };

    /* keep only the most recent update that is not invalidating existing answers */
    cumulated = _.reduce(req.body.texts, function(memo, textEntry) {
        if(textEntry.value.length < 2)
            return memo;
        const questionId = textEntry.id;
        memo[questionId] = textEntry.value;
        return memo;
    }, cumulated);
    cumulated = _.reduce(req.body.sliders, function(memo, sliderEntry) {
        const questionId = sliderEntry.id;
        memo[questionId] = sliderEntry.value;
        return memo;
    }, cumulated)
    cumulated = _.reduce(req.body.radio, function(memo, radioEntry) {
        const questionId = radioEntry.id;
        memo[questionId] = radioEntry.value;
        return memo;
    }, cumulated);
    cumulated = _.reduce(req.body.checkboxes, function(memo, radioEntry) {
        const questionId = radioEntry.id;
        memo[questionId] = radioEntry.value;
        return memo;
    }, cumulated);

    await mongo3.deleteMany(mongoc, nconf.get('schema').answers, { sessionId })
    const result = await mongo3.writeOne(mongoc, nconf.get('schema').answers, cumulated);
    return { json: {
        accumulating: cumulated,
        res: result.result
    }};
};

async function retrieveAnswers(req) {
    // JSON do not require questionaire name specified, CSV does
    if(!security.checkPassword(req))
        return {json: { error: true, message: "Invalid key" }};

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const answers = await mongo3.read(mongoc, nconf.get('schema').answers, {}, { lastUpdate: 1});
    await mongoc.close();

    const revisited = _.map(_.reverse(answers), function(ans) {
        return cleanAnswerFromDB(ans);
    });
    return { json: revisited };
};

async function retrieveMails(req) {
    if(!security.checkPassword(req))
        return {json: { error: true, message: "Invalid key" }};

    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const emails = await mongo3.read(mongoc, nconf.get('schema').emails, {}, { registeredAt: 1 });
    await mongoc.close();

    const revisited = _.map(emails, function(email, order) {
        _.unset(email, '_id');
        email.order = order;
        return email;
    });
    debug("Email API: returning %d addresses", _.size(revisited));
    return { json: _.reverse(revisited) };
};


/* this is helpful to produce a CSV without a wasy too big complexity
 * in keys enumeration. has not other meanings */
const youtubersQmap = [
    ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19"],
    ["21", "22", "23", "24", "25", "26" ],
    ["31", "32", "33", "34", "35", "36", "37" ],
    ["41", "42", "43", "44", "45" ]
];
const watchersQmap = [
    ["51", "52", "53", "54", "55", "56", "57", "58", "59" ],
    ["61", "62", "63", "64", "65", "66" ],
    ["71", "72", "73", "74", "75" ],
    ["81", "82", "83" ]
]

async function retrieveAnswersCSV(req) {
    // CSV function require questionaire name specified, JSON don't
    if(!security.checkPassword(req))
        return {json: { error: true, message: "Invalid key" }};
    
    const qName = req.params.qName;
    if(allowqnames.indexOf(qName) === -1)
        throw new Error("Invalid Questionnaire requested")
    
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const answers = await mongo3.read(mongoc, nconf.get('schema').answers, { qName }, { lastUpdate: 1});
    await mongoc.close();

    const usableMap = (qName === "youtubers") ? youtubersQmap : watchersQmap;
    const csvcontent = csv.produceCSVv1(answers, _.concat(
        [ "sessionId", "lastUpdate", "reference", "version", "qName" ],
        _.flatten(usableMap)
    ));

    const filename = `answers-${qName}-${answers.length}.csv`;
    return {
        headers: {
            "Content-Type": "csv/text",
            "Content-Disposition": "attachment; filename=" + filename
        },
        text: csvcontent
    }
};

async function deleteAnswer(req, res) {
    throw new Error("TODO implement this")
};

module.exports = {
    recordAnswers,
    retrieveAnswers,
    retrieveMails,
    retrieveAnswersCSV,
    deleteAnswer,
};
