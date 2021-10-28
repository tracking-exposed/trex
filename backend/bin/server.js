#!/usr/bin/env node
const express = require('express');
const app = express();
const server = require('http').Server(app);
const _ = require('lodash');
const bodyParser = require('body-parser');
const debug = require('debug')('yttrex');
const nconf = require('nconf');
const cors = require('cors');

const dbutils = require('../lib/dbutils');
const { apiList }= require('../lib/api');
const security = require('../lib/security');

const cfgFile = "config/settings.json";
const redOn = "\033[31m";
const redOff = "\033[0m";

nconf.argv().env().file({ file: cfgFile });

console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

if(!nconf.get('interface') || !nconf.get('port') )
    throw new Error("check your config/settings.json, config of 'interface' and 'post' missing");

async function iowrapper(fname, req, res) {
  try {
    const funct = apiList[fname];
    const httpresult = await funct(req, res)

    if (!httpresult) {
        res.send("Error: not implemented");
        debug("Error, not implemented function in this API");
        return;
    }

    if (httpresult.headers)
        _.each(httpresult.headers, function(value, key) {
            debug("Setting header %s: %s", key, value);
            res.setHeader(key, value);
        });

    if (httpresult.json) {
        debug("API (%d bytes) success, returning JSON (%d bytes)",
          _.size(JSON.stringify(req.body)),
          _.size(JSON.stringify(httpresult.json)),
        );
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(httpresult.json);
    } else if (httpresult.text) {
        debug("API success, returning text (size %d)", _.size(httpresult.text));
        res.send(httpresult.text);
    } else {
        debug("Undetermined failure in API call, result →  %j", httpresult);
        res.status(502);
        res.send("Error?");
        return false;
    }

  } catch(error) {
    res.send(error.message);
    debug("Error: %o", error);
  }
}

/* This function wraps all the API call, checking the verionNumber
 * managing error in 4XX/5XX messages and making all these asyncronous
 * I/O with DB, inside this Bluebird */

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface'));
console.log(" Listening on http://" + nconf.get('interface') + ":" + nconf.get('port'));
/* configuration of express4 */
app.use(cors());
app.options('/api/', cors())
app.use(bodyParser.json({limit: '6mb'}));
app.use(bodyParser.urlencoded({limit: '6mb', extended: true}));

app.get('/api/v1/last', async (req, res) => await iowrapper('getLast', req, res))
app.get('/api/v1/home', async (req, res) => await iowrapper('getLastHome', req, res))
app.get('/api/v1/videoId/:query', async (req, res) => await iowrapper('getVideoId', req, res))
app.get('/api/v1/related/:query', async (req, res) => await iowrapper('getRelated', req, res))
app.get('/api/v1/videoCSV/:query/:amount?', async (req, res) => await iowrapper('getVideoCSV', req, res))
app.get('/api/v1/author/:query/:amount?', async (req, res) => await iowrapper('getByAuthor', req, res))

/* This is import and validate the key */
app.post('/api/v:version/validate', async (req, res) => await iowrapper('validateKey', req, res))
app.post('/api/v1/events', async (req, res) => await iowrapper('discontinued', req, res))
app.post('/api/v2/events', async (req, res) => await iowrapper('processEvents2', req, res))

/* new timeline timeseries on top */
app.get('/api/v1/personal/:publicKey/timeline/:paging?', async (req, res) => await iowrapper('getPersonalTimeline', req, res))

/* download your CSV (home or video) */
app.get('/api/v2/personal/:publicKey/:type/csv', async (req, res) => await iowrapper('getPersonalCSV', req, res))

/* API for researcher: get your related as single list */
app.get('/api/v1/personal/:publicKey/related/:paging?', async (req, res) => await iowrapper('getPersonalRelated', req, res));

app.post('/api/v3/registerEmail', async (req, res) => await iowrapper('registerEmail', req, res));

/* record answers from surveys */
app.post('/api/v1/recordAnswers', async (req, res) => await iowrapper("recordAnswers", req, res))
app.get('/api/v1/retrieveAnswers/:key', async (req, res) => await iowrapper("retrieveAnswers", req, res))
app.get('/api/v1/retrieveAnswersCSV/:qName/:key', async (req, res) => await iowrapper("retrieveAnswersCSV", req, res))
app.get('/api/v1/retrieveMails/:key', async (req, res) => await iowrapper("retrieveMails", req, res))

/* researcher */
app.get('/api/v1/wetest/:key/:filter', async (req, res) => await iowrapper('researcher', req, res))

/* this return a summary (profile, total amount of videos, last videos, last searches */
app.get('/api/v1/personal/:publicKey/:paging?', async (req, res) => await iowrapper('getPersonal', req, res))

/* action on specific evidence */
app.delete('/api/v2/personal/:publicKey/selector/id/:id', async (req, res) => await iowrapper('removeEvidence', req, res))
app.get('/api/v2/personal/:publicKey/selector/:key/:value', async (req, res) => await iowrapper('getEvidences', req, res))

/* Update in progress, toward parserv3 */
app.get('/api/v1/html/:metadataId', async (req, res) => await iowrapper('unitById', req, res))

/* rsync your data back */
app.get('/api/v1/rsync/:daysago?', async (req, res) => await iowrapper('rsync', req, res))

/* monitor for admin */
app.get('/api/v2/monitor/:key', async (req, res) => await iowrapper('getMonitor', req, res))

/* research subscription and I/O --- note the promise is still rsync? wtf. */
app.get('/api/v1/research/:publicKey', async (req, res) => await iowrapper('rsync', req, res))

/* admin */
app.get('/api/v1/mirror/:key', async (req, res) => await iowrapper('getMirror', req, res))

/* below, youchoose v3 */
app.post('/api/v3/handshake', async (req, res) => await iowrapper('youChooseByVideoId', req, res))
app.get('/api/v3/video/:videoId/recommendations', async (req, res) => await iowrapper('youChooseByVideoId', req, res))
app.get('/api/v3/recommendations/:ids', async (req, res) => await iowrapper('recommendationById', req, res))

app.post('/api/v3/creator/updateVideo', (req, res) => dispatchPromise('updateVideoRec', req, res))
app.post('/api/v3/creator/ogp', cors(), (req, res) => dispatchPromise('ogpProxy', req, res))
app.get('/api/v3/creator/videos', (req, res) => dispatchPromise('getVideoByCreator', req, res))
app.post('/api/v3/creator/videos/repull', (req, res) => dispatchPromise('repullByCreator', req, res))

app.get('/api/v3/creator/recommendations/:publicKey', (req, res) => dispatchPromise('youChooseByProfile', req, res))
app.get('/api/v3/creator/:channelId/related/:amount?', (req, res) => dispatchPromise('getCreatorRelated', req, res))
app.get('/api/v3/creator/:channelId/stats', (req, res) => dispatchPromise('getCreatorStats', req, res))

/* below, guardoni-v2 */
app.post('/api/v3/directives/:directiveType', async (req, res) => await iowrapper('postDirective', req, res))
app.get('/api/v3/directives/:experimentId', async (req, res) => await iowrapper('fetchDirective', req, res))
app.post('/api/v2/handshake', async (req, res) => await iowrapper('experimentChannel3', req, res))
app.delete('/api/v3/experiment/:testTime', async (req, res) => await iowrapper('concludeExperiment3', req, res))

/* below, the few API endpoints */
app.post('/api/v3/creator/:channelId/register', async (req, res) => await iowrapper('creatorRegister', req, res))
app.post('/api/v3/creator/:channelId/verify', async (req, res) => await iowrapper('creatorVerify', req, res))
app.get('/api/v3/creator/me', async (req, res) => await iowrapper('creatorGet', req, res))

/* below, the new API for advertising */
app.get('/api/v2/ad/video/:videoId', async (req, res) => await iowrapper('adsPerVideo', req, res));
app.get('/api/v2/ad/channel/:videoId', async (req, res) => await iowrapper('adsPerChannel', req, res));

/* impact */
app.get('/api/v2/statistics/:name/:unit/:amount', async (req, res) => await iowrapper('getStatistics', req, res))

/* delete a group from your profile, create a new tagId */
app.delete('/api/v2/profile/:publicKey/tag/:tagName', async (req, res) => await iowrapper('removeTag', req, res))
app.post('/api/v2/profile/:publicKey/tag', async (req, res) => await iowrapper('createAndOrJoinTag', req, res))

/* update and current profile */
app.get('/api/v2/profile/:publicKey/tag', async (req, res) => await iowrapper('profileStatus', req, res))
app.post('/api/v2/profile/:publicKey', async (req, res) => await iowrapper("updateProfile", req, res))

/* to get results of search queries! */
app.get('/api/v2/searches/:idList/dot', async (req, res) => await iowrapper('getSearchesDot', req, res))
app.get('/api/v2/searches/:query/CSV', async (req, res) => await iowrapper('getSearchesCSV', req, res))
app.get('/api/v2/queries/:campaignName', async (req, res) => await iowrapper('getQueries', req, res))
app.get('/api/v2/searches/:query/:paging?', async (req, res) => await iowrapper('getSearches', req, res))
app.get('/api/v2/searchid/:listof', async (req, res) => await iowrapper('getSearchDetails', req, res))
app.get('/api/v2/search/keywords/:paging?', async (req, res) => await iowrapper('getSearchKeywords', req, res))

/* to configure search comparison */
app.post('/api/v2/campaigns/:key', async (req, res) => await iowrapper('updateCampaigns', req, res))

/* guardoni support APIs */
app.post('/api/v2/experiment/opening', async (req, res) => await iowrapper('experimentOpening', req, res))
app.post('/api/v2/experiment', async (req, res) => await iowrapper('experimentSubmission', req, res))
app.get('/api/v2/experiment/:expname/csv', async (req, res) => await iowrapper('experimentCSV', req, res))
app.get('/api/v2/experiment/:expname/dot', cors(), async (req, res) => await iowrapper('experimentDOT', req, res))
app.get('/api/v2/experiment/:expname/json', cors(), async (req, res) => await iowrapper('experimentJSON', req, res))
app.get('/api/v2/guardoni/list', async (req, res) => await iowrapper('getAllExperiments', req, res))

// dynamically configured and retrived guardoni settings 
app.post('/api/v2/guardoni/:experiment/:botname', async (req, res) => await iowrapper('guardoniConfigure', req, res))
app.get('/api/v2/guardoni/:experiment/:botname', async (req, res) => await iowrapper('guardoniGenerate', req, res))


async function initialSanityChecks() {
    /* security checks = is the password set and is not the default? (more checks might come) */
    security.checkKeyIsSet();
    await dbutils.checkMongoWorks(beFatal=true);
}

initialSanityChecks();
