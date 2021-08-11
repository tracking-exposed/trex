#!/usr/bin/env node
const express = require('express');
const app = express();
const server = require('http').Server(app);
const _ = require('lodash');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const debug = require('debug')('yttrex');
const nconf = require('nconf');
const cors = require('cors');

const dbutils = require('../lib/dbutils');
const APIs = require('../lib/api');
const security = require('../lib/security');

const cfgFile = "config/settings.json";
const redOn = "\033[31m";
const redOff = "\033[0m";

nconf.argv().env().file({ file: cfgFile });

console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

if(!nconf.get('interface') || !nconf.get('port') )
    throw new Error("check your config/settings.json, config of 'interface' and 'post' missing");

var returnHTTPError = function(req, res, funcName, where) {
    debug("HTTP error 500 %s [%s]", funcName, where);
    res.status(500);
    res.send();
    return false;
};


/* This function wraps all the API call, checking the verionNumber
 * managing error in 4XX/5XX messages and making all these asyncronous
 * I/O with DB, inside this Bluebird */
function dispatchPromise(name, req, res) {

    const func = _.get(APIs.implementations, name, null);
    if(_.isNull(func)) {
        debug("Invalid function request %s", name);
        res.status(404);
        res.send("function not found");
        return false;
    }
    return new Promise.resolve(func(req)).then(function(httpresult) {

        if(_.isObject(httpresult.headers))
            _.each(httpresult.headers, function(value, key) {
                res.setHeader(key, value);
            });

        if(httpresult.json) {
            debug("%s API success, returning JSON (%d bytes)",
                name, _.size(JSON.stringify(httpresult.json)) );
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.json(httpresult.json);
        } else if(httpresult.text) {
            debug("API %s success, returning text (size %d)", name, _.size(httpresult.text));
            res.send(httpresult.text);
        } else {
            debug("Undetermined failure in API call, result →  %j", httpresult);
            res.status(502);
            res.send("Error?");
            return false;
        }
        return true;
    })
    .catch(function(error) {
        debug("%s Trigger an Exception: %s", name, error);
        res.status(501);
        res.send(error.message);
        return false;
    });
};

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface'));
console.log(" Listening on http://" + nconf.get('interface') + ":" + nconf.get('port'));
/* configuration of express4 */
app.use(cors());
app.options('/api/', cors())
app.use(bodyParser.json({limit: '6mb'}));
app.use(bodyParser.urlencoded({limit: '6mb', extended: true}));

app.get('/api/v1/last', function(req, res) {
    return dispatchPromise('getLast', req, res);
});
app.get('/api/v1/home', function(req, res) {
    return dispatchPromise('getLastHome', req, res);
});
app.get('/api/v1/videoId/:query', function(req, res) {
    return dispatchPromise('getVideoId', req, res);
});
app.get('/api/v1/related/:query', function(req, res) {
    return dispatchPromise('getRelated', req, res);
});
app.get('/api/v1/videoCSV/:query/:amount?', function(req, res) {
    return dispatchPromise('getVideoCSV', req, res);
});
app.get('/api/v1/author/:query/:amount?', function(req, res) {
    return dispatchPromise('getByAuthor', req, res);
});

/* This is import and validate the key */
app.post('/api/v:version/validate', function(req, res) {
    return dispatchPromise('validateKey', req, res);
});
app.post('/api/v1/events', function(req, res) {
    return dispatchPromise('discontinued', req, res);
});
app.post('/api/v2/events', function(req, res) {
    return dispatchPromise('processEvents2', req, res);
});

/* new timeline timeseries on top */
app.get('/api/v1/personal/:publicKey/timeline/:paging?', (req, res) => {
    return dispatchPromise('getPersonalTimeline', req, res);
});
/* download your CSV (home or video) */
app.get('/api/v2/personal/:publicKey/:type/csv', function(req, res) {
    return dispatchPromise('getPersonalCSV', req, res);
});
/* API for researcher: get your related as single list */
app.get('/api/v1/personal/:publicKey/related/:paging?', function(req, res) {
    return dispatchPromise('getPersonalRelated', req, res);
});

/* record answers from surveys */
app.post('/api/v1/recordAnswers', function(req, res) {
    return dispatchPromise("recordAnswers", req, res);
});
app.get('/api/v1/retrieveAnswers/:key', function(req, res) {
    return dispatchPromise("retrieveAnswers", req, res);
});
app.get('/api/v1/retrieveAnswersCSV/:key', function(req, res) {
    return dispatchPromise("retrieveAnswersCSV", req, res);
});

/* researcher */
app.get('/api/v1/wetest/:key/:filter', function(req, res) {
    return dispatchPromise('researcher', req, res);
});

/* this return a summary (profile, total amount of videos, last videos, last searches */
app.get('/api/v1/personal/:publicKey/:paging?', function(req, res) {
    return dispatchPromise('getPersonal', req, res);
});

/* action on specific evidence */
app.delete('/api/v2/personal/:publicKey/selector/id/:id', (req, res) => {
    return dispatchPromise('removeEvidence', req, res);
});
app.get('/api/v2/personal/:publicKey/selector/:key/:value', (req, res) => {
    return dispatchPromise('getEvidences', req, res);
});

/* Update in progress, toward parserv3 */
app.get('/api/v1/html/:metadataId', function(req, res) {
    return dispatchPromise('unitById', req, res);
});

/* rsync your data back */
app.get('/api/v1/rsync/:daysago?', function(req, res) {
    return dispatchPromise('rsync', req, res);
});

/* monitor for admin */
app.get('/api/v2/monitor/:minutes?', function(req, res) {
    return dispatchPromise('getMonitor', req, res);
});

/* research subscription and I/O --- note the promise is still rsync? wtf. */
app.get('/api/v1/research/:publicKey', function(req, res) {
    return dispatchPromise('rsync', req, res);
});

/* admin */
app.get('/api/v1/mirror/:key', function(req, res) {
    return dispatchPromise('getMirror', req, res);
});

/* handshake should be renamed for youchoose functionality */
app.post('/api/v3/handshake', function(req, res) {
    return dispatchPromise('youChooseByVideoId', req, res);
});
app.get('/api/v3/recommendations/:videoId', function(req, res) {
    return dispatchPromise('youChooseByVideoId', req, res);
});

/* impact */
app.get('/api/v2/statistics/:name/:unit/:amount', function(req, res) {
    return dispatchPromise('getStatistics', req, res);
});

/* delete a group from your profile, create a new tagId */
app.delete('/api/v2/profile/:publicKey/tag/:tagName', (req, res) => {
    return dispatchPromise('removeTag', req, res);
});
app.post('/api/v2/profile/:publicKey/tag', (req, res) => {
    return dispatchPromise('createAndOrJoinTag', req, res);
});

/* update and current profile */
app.get('/api/v2/profile/:publicKey/tag', (req, res) => {
    return dispatchPromise('profileStatus', req, res);
});
app.post('/api/v2/profile/:publicKey', (req, res) => {
    return dispatchPromise("updateProfile", req, res);
});

/* to get results of search queries! */
app.get('/api/v2/searches/:idList/dot', (req, res) => {
    return dispatchPromise('getSearchesDot', req, res);
});
app.get('/api/v2/searches/:query/CSV', (req, res) => {
    return dispatchPromise('getSearchesCSV', req, res);
});
app.get('/api/v2/queries/:campaignName', (req, res) => {
    return dispatchPromise('getQueries', req, res);
});
app.get('/api/v2/searches/:query/:paging?', (req, res) => {
    return dispatchPromise('getSearches', req, res);
});
app.get('/api/v2/searchid/:listof', (req, res) => {
    return dispatchPromise('getSearchDetails', req, res);
});
app.get('/api/v2/search/keywords/:paging?', (req, res) => {
    return dispatchPromise('getSearchKeywords', req, res);
});

/* to configure search comparison */
app.post('/api/v2/campaigns/:key', (req, res) => {
    return dispatchPromise('updateCampaigns', req, res);
});

/* guardoni support APIs */
app.post('/api/v2/experiment', (req, res) => {
    return dispatchPromise('experimentSubmission', req, res);
});
app.get('/api/v2/experiment/:expname/csv', (req, res) => {
    return dispatchPromise('experimentCSV', req, res);
});
app.get('/api/v2/experiment/:expname/dot', cors(), (req, res) => {
    return dispatchPromise('experimentDOT', req, res);
});
app.get('/api/v2/experiment/:expname/json', cors(), (req, res) => {
    return dispatchPromise('experimentJSON', req, res);
});
app.get('/api/v2/guardoni/list', (req, res) => {
    return dispatchPromise('getAllExperiments', req, res);
});
// dynamically configured and retrived guardoni settings 
app.post('/api/v2/guardoni/:experiment/:botname', (req, res) => {
    return dispatchPromise('guardoniConfigure', req, res);
});
app.get('/api/v2/guardoni/:experiment/:botname', (req, res) => {
    return dispatchPromise('guardoniGenerate', req, res);
});

/* security checks = is the password set and is not the default? (more checks might come) */
security.checkKeyIsSet();

Promise.resolve().then(function() {
    if(dbutils.checkMongoWorks()) {
        debug("mongodb connection works");
    } else {
        console.log("mongodb is not running - check", cfgFile," - quitting");
        process.exit(1);
    }
});
