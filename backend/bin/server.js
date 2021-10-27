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

/* This function wraps all the API call, checking the verionNumber
 * managing error in 4XX/5XX messages and making all these asyncronous
 * I/O with DB, inside this Bluebird */
function dispatchPromise(name, req, res) {

    const func = _.get(APIs.implementations, name, null);
    if(_.isNull(func)) {
        debug("Unexistend function requested %s", name);
        res.status(404);
        res.send("function not found");
        return false;
    }
    return new Promise.resolve(func(req)).then(function(httpresult) {

        if(!httpresult) {
            debug("Undetermined failure in API call!");
            res.status(502);
            res.send("Missing a return value from the route handler!");
            return false;
        }

        if(_.isObject(httpresult.headers))
            _.each(httpresult.headers, function(value, key) {
                res.setHeader(key, value);
            });

        if(httpresult.status) {
            res.status(httpresult.status);
            res.send();
        } else if(httpresult.json) {
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

app.get('/api/v1/last', (req, res) => dispatchPromise('getLast', req, res))
app.get('/api/v1/home', (req, res) => dispatchPromise('getLastHome', req, res))
app.get('/api/v1/videoId/:query', (req, res) => dispatchPromise('getVideoId', req, res))
app.get('/api/v1/related/:query', (req, res) => dispatchPromise('getRelated', req, res))
app.get('/api/v1/videoCSV/:query/:amount?', (req, res) => dispatchPromise('getVideoCSV', req, res))
app.get('/api/v1/author/:query/:amount?', (req, res) => dispatchPromise('getByAuthor', req, res))

/* This is import and validate the key */
app.post('/api/v:version/validate', (req, res) => dispatchPromise('validateKey', req, res))
app.post('/api/v1/events', (req, res) => dispatchPromise('discontinued', req, res))
app.post('/api/v2/events', (req, res) => dispatchPromise('processEvents2', req, res))

/* new timeline timeseries on top */
app.get('/api/v1/personal/:publicKey/timeline/:paging?', (req, res) => dispatchPromise('getPersonalTimeline', req, res))

/* download your CSV (home or video) */
app.get('/api/v2/personal/:publicKey/:type/csv', (req, res) => dispatchPromise('getPersonalCSV', req, res))

/* API for researcher: get your related as single list */
app.get('/api/v1/personal/:publicKey/related/:paging?', (req, res) => dispatchPromise('getPersonalRelated', req, res));

app.post('/api/v3/registerEmail', (req, res) => dispatchPromise('registerEmail', req, res));

/* record answers from surveys */
app.post('/api/v1/recordAnswers', (req, res) => dispatchPromise("recordAnswers", req, res))
app.get('/api/v1/retrieveAnswers/:key', (req, res) => dispatchPromise("retrieveAnswers", req, res))
app.get('/api/v1/retrieveAnswersCSV/:qName/:key', (req, res) => dispatchPromise("retrieveAnswersCSV", req, res))
app.get('/api/v1/retrieveMails/:key', (req, res) => dispatchPromise("retrieveMails", req, res))

/* researcher */
app.get('/api/v1/wetest/:key/:filter', (req, res) => dispatchPromise('researcher', req, res))

/* this return a summary (profile, total amount of videos, last videos, last searches */
app.get('/api/v1/personal/:publicKey/:paging?', (req, res) => dispatchPromise('getPersonal', req, res))

/* action on specific evidence */
app.delete('/api/v2/personal/:publicKey/selector/id/:id', (req, res) => dispatchPromise('removeEvidence', req, res))
app.get('/api/v2/personal/:publicKey/selector/:key/:value', (req, res) => dispatchPromise('getEvidences', req, res))

/* Update in progress, toward parserv3 */
app.get('/api/v1/html/:metadataId', (req, res) => dispatchPromise('unitById', req, res))

/* rsync your data back */
app.get('/api/v1/rsync/:daysago?', (req, res) => dispatchPromise('rsync', req, res))

/* monitor for admin */
app.get('/api/v2/monitor/:key', (req, res) => dispatchPromise('getMonitor', req, res))

/* research subscription and I/O --- note the promise is still rsync? wtf. */
app.get('/api/v1/research/:publicKey', (req, res) => dispatchPromise('rsync', req, res))

/* admin */
app.get('/api/v1/mirror/:key', (req, res) => dispatchPromise('getMirror', req, res))

/* below, youchoose v3 */
app.post('/api/v3/handshake', (req, res) => dispatchPromise('youChooseByVideoId', req, res))
app.get('/api/v3/video/:videoId/recommendations', (req, res) => dispatchPromise('youChooseByVideoId', req, res))
app.get('/api/v3/recommendations/:ids', (req, res) => dispatchPromise('recommendationById', req, res))

app.post('/api/v3/creator/updateVideo', (req, res) => dispatchPromise('updateVideoRec', req, res))
app.post('/api/v3/creator/ogp', cors(), (req, res) => dispatchPromise('ogpProxy', req, res))
app.get('/api/v3/creator/videos', (req, res) => dispatchPromise('getVideoByCreator', req, res))
app.post('/api/v3/creator/videos/repull', (req, res) => dispatchPromise('repullByCreator', req, res))

app.get('/api/v3/creator/recommendations/:publicKey', (req, res) => dispatchPromise('youChooseByProfile', req, res))
app.get('/api/v3/creator/:channelId/related/:amount?', (req, res) => dispatchPromise('getCreatorRelated', req, res))
app.get('/api/v3/creator/:channelId/stats', (req, res) => dispatchPromise('getCreatorStats', req, res))

/* below, guardoni-v2 */
app.post('/api/v3/directives/:directiveType', (req, res) => dispatchPromise('postDirective', req, res))
app.get('/api/v3/directives/:experimentId', (req, res) => dispatchPromise('fetchDirective', req, res))
app.post('/api/v2/handshake', (req, res) => dispatchPromise('experimentChannel3', req, res))
app.delete('/api/v3/experiment/:testTime', (req, res) => dispatchPromise('concludeExperiment3', req, res))

/* below, the few API endpoints */
app.post('/api/v3/creator/:channelId/register', (req, res) => dispatchPromise('creatorRegister', req, res))
app.post('/api/v3/creator/:channelId/verify', (req, res) => dispatchPromise('creatorVerify', req, res))
app.get('/api/v3/creator/me', (req, res) => dispatchPromise('creatorGet', req, res))

/* below, the new API for advertising */
app.get('/api/v2/ad/video/:videoId', (req, res) => dispatchPromise('adsPerVideo', req, res));
app.get('/api/v2/ad/channel/:videoId', (req, res) => dispatchPromise('adsPerChannel', req, res));

/* impact */
app.get('/api/v2/statistics/:name/:unit/:amount', (req, res) => dispatchPromise('getStatistics', req, res))

/* delete a group from your profile, create a new tagId */
app.delete('/api/v2/profile/:publicKey/tag/:tagName', (req, res) => dispatchPromise('removeTag', req, res))
app.post('/api/v2/profile/:publicKey/tag', (req, res) => dispatchPromise('createAndOrJoinTag', req, res))

/* update and current profile */
app.get('/api/v2/profile/:publicKey/tag', (req, res) => dispatchPromise('profileStatus', req, res))
app.post('/api/v2/profile/:publicKey', (req, res) => dispatchPromise("updateProfile", req, res))

/* to get results of search queries! */
app.get('/api/v2/searches/:idList/dot', (req, res) => dispatchPromise('getSearchesDot', req, res))
app.get('/api/v2/searches/:query/CSV', (req, res) => dispatchPromise('getSearchesCSV', req, res))
app.get('/api/v2/queries/:campaignName', (req, res) => dispatchPromise('getQueries', req, res))
app.get('/api/v2/searches/:query/:paging?', (req, res) => dispatchPromise('getSearches', req, res))
app.get('/api/v2/searchid/:listof', (req, res) => dispatchPromise('getSearchDetails', req, res))
app.get('/api/v2/search/keywords/:paging?', (req, res) => dispatchPromise('getSearchKeywords', req, res))

/* to configure search comparison */
app.post('/api/v2/campaigns/:key', (req, res) => dispatchPromise('updateCampaigns', req, res))

/* guardoni support APIs */
app.post('/api/v2/experiment/opening', (req, res) => dispatchPromise('experimentOpening', req, res))
app.post('/api/v2/experiment', (req, res) => dispatchPromise('experimentSubmission', req, res))
app.get('/api/v2/experiment/:expname/csv', (req, res) => dispatchPromise('experimentCSV', req, res))
app.get('/api/v2/experiment/:expname/dot', cors(), (req, res) => dispatchPromise('experimentDOT', req, res))
app.get('/api/v2/experiment/:expname/json', cors(), (req, res) => dispatchPromise('experimentJSON', req, res))
app.get('/api/v2/guardoni/list', (req, res) => dispatchPromise('getAllExperiments', req, res))

// dynamically configured and retrived guardoni settings 
app.post('/api/v2/guardoni/:experiment/:botname', (req, res) => dispatchPromise('guardoniConfigure', req, res))
app.get('/api/v2/guardoni/:experiment/:botname', (req, res) => dispatchPromise('guardoniGenerate', req, res))

/* security checks = is the password set and is not the default? (more checks might come) */
security.checkKeyIsSet();

Promise.resolve().then(async function() {
    const success = await dbutils.checkMongoWorks();
    if(success)
        debug("mongodb connection works!");
    else {
        console.log("mongodb is not running: quitting");
        console.log("config derived", nconf.get('mongoDb'));
        process.exit(1);
    }
});
