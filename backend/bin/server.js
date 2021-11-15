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

    if (httpresult.headers)
        _.each(httpresult.headers, function(value, key) {
            debug("Setting header %s: %s", key, value);
            res.setHeader(key, value);
        });

    if (!httpresult) {
        debug("API (%s) didn't return anything!?", fname);
        res.send("Fatal error: Invalid output");
        res.status(501);
    } else if (httpresult.json && httpresult.json.error) {
        debug("API (%s) failure, returning 500", fname);
        res.status(500);
        res.json(httpresult.json);
    } else if (httpresult.json) {
        debug("API (%s) success, returning %d bytes JSON",
          fname, _.size(JSON.stringify(httpresult.json)));
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(httpresult.json);
    } else if (httpresult.text) {
        debug("API (%s) success, returning text (size %d)", fname, _.size(httpresult.text));
        res.send(httpresult.text);
    } else {
        debug("Undetermined failure in API (%s) →  %j", fname, httpresult);
        res.status(502);
        res.send("Error?");
    }

  } catch(error) {
    res.status(502);
    res.send("Software error: " + error.message);
    debug("Error in HTTP handler API(%s): %o", fname, error);
  }
  res.end();
}

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface'));
console.log(" Listening on http://" + nconf.get('interface') + ":" + nconf.get('port'));
/* configuration of express4 */
app.use(cors());
app.options('/api/', cors())
app.use(bodyParser.json({limit: '6mb'}));
app.use(bodyParser.urlencoded({limit: '6mb', extended: true}));

/* this API is v0 as it is platform neutral. it might be shared among
 * all the trex backends, and should return info on system health, echo OK
 * if the system is OK, and the git log of the code running */
app.get('/api/v0/info', async (req, res) => await iowrapper('systemInfo', req, res));
app.get('/api/v0/health', function(req, res) { res.send("OK"); res.status(200); });

app.get('/api/v1/last', async (req, res) => await iowrapper('getLast', req, res))
app.get('/api/v1/home', async (req, res) => await iowrapper('getLastHome', req, res))
app.get('/api/v1/videoId/:videoId', async (req, res) => await iowrapper('getVideoId', req, res))
app.get('/api/v1/related/:videoId', async (req, res) => await iowrapper('getRelated', req, res))
app.get('/api/v1/videoCSV/:videoId/:amount?', async (req, res) => await iowrapper('getVideoCSV', req, res))
app.get('/api/v1/author/:videoId/:amount?', async (req, res) => await iowrapper('getByAuthor', req, res))

/* This is the API meant to receive data donation */
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

/* monitor and flexible deleter for admin */
app.get('/api/v2/monitor/:key', async (req, res) => await iowrapper('getMonitor', req, res))
app.delete('/api/v2/deleter/:key/:c/:k/:id', async (req, res) => await iowrapper('deleter', req, res))

/* admin */
app.get('/api/v1/mirror/:key', async (req, res) => await iowrapper('getMirror', req, res))

/* below, youchoose v3 */
app.post('/api/v3/handshake', async (req, res) => await iowrapper('youChooseByVideoId', req, res))
app.get('/api/v3/video/:videoId/recommendations', async (req, res) => await iowrapper('youChooseByVideoId', req, res))
app.get('/api/v3/recommendations/:ids', async (req, res) => await iowrapper('recommendationById', req, res))

app.post('/api/v3/creator/updateVideo', async (req, res) => await iowrapper('updateVideoRec', req, res))
app.post('/api/v3/creator/ogp', async (req, res) => await iowrapper('ogpProxy', req, res))
app.post('/api/v3/creator/videos/repull', async (req, res) => await iowrapper('repullByCreator', req, res))
app.get('/api/v3/creator/videos', async (req, res) => await iowrapper('getVideoByCreator', req, res))
app.get('/api/v3/creator/videos/:videoId', async (req, res) => await iowrapper('getOneVideoByCreator', req, res))
app.get('/api/v3/creator/recommendations', async (req, res) => await iowrapper('youChooseByProfile', req, res))
app.get('/api/v3/creator/:channelId/related/:amount?', async (req, res) => await iowrapper('getCreatorRelated', req, res))
app.get('/api/v3/creator/:channelId/stats', async (req, res) => await iowrapper('getCreatorStats', req, res))

app.get('/api/v3/opendata/channels', async (req, res) => await iowrapper('opendataChannel', req, res));

/* below, the few API endpoints */
app.post('/api/v3/creator/:channelId/register', async (req, res) => await iowrapper('creatorRegister', req, res))
app.post('/api/v3/creator/:channelId/verify', async (req, res) => await iowrapper('creatorVerify', req, res))
app.get('/api/v3/creator/me', async (req, res) => await iowrapper('creatorGet', req, res))

/* below, the new API for advertising */
app.get('/api/v2/ad/video/:videoId', async (req, res) => await iowrapper('adsPerVideo', req, res));
app.get('/api/v2/ad/channel/:channelId', async (req, res) => await iowrapper('adsPerChannel', req, res));
app.get('/api/v2/ad/:amount?', async (req, res) => await iowrapper('adsUnbound', req, res));

/* impact */
app.get('/api/v2/statistics/:name/:unit/:amount', async (req, res) => await iowrapper('getStatistics', req, res))

/* delete a group from your profile, create a new tagId --- outdated, verify */
app.delete('/api/v2/profile/:publicKey/tag/:tagName', async (req, res) => await iowrapper('removeTag', req, res))
app.post('/api/v2/profile/:publicKey/tag', async (req, res) => await iowrapper('createAndOrJoinTag', req, res))

/* update and current profile  --- outdated, verify. */
app.get('/api/v2/profile/:publicKey/tag', async (req, res) => await iowrapper('profileStatus', req, res))
app.post('/api/v2/profile/:publicKey', async (req, res) => await iowrapper("updateProfile", req, res))

/* to get results of search queries! -- to be retested, CSV is OK, but perhaps only it. */
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

// dynamically configured and retrived guardoni settings
// app.post('/api/v2/guardoni/:experiment/:botname', async (req, res) => await iowrapper('guardoniConfigure', req, res))
// app.get('/api/v2/guardoni/:experiment/:botname', async (req, res) => await iowrapper('guardoniGenerate', req, res))


/* experiments dependend API -- the one below have been tested */
app.get('/api/v2/guardoni/list/:directiveType', async (req, res) => await iowrapper('getAllExperiments', req, res))
app.post('/api/v3/directives/:directiveType', async (req, res) => await iowrapper('postDirective', req, res))
app.get('/api/v3/directives/:experimentId', async (req, res) => await iowrapper('fetchDirective', req, res))
app.post('/api/v2/handshake', async (req, res) => await iowrapper('experimentChannel3', req, res))
app.delete('/api/v3/experiment/:testTime', async (req, res) => await iowrapper('concludeExperiment3', req, res))
app.get('/api/v2/experiment/:experimentId/json', async (req, res) => await iowrapper('experimentJSON', req, res))
app.get('/api/v2/experiment/:experimentId/csv/:type', async (req, res) => await iowrapper('experimentCSV', req, res))
app.get('/api/v2/experiment/:experimentId/dot', async (req, res) => await iowrapper('experimentDOT', req, res))

app.get('*', async (req, res) => {
    debug("URL not handled: %s", req.url);
    res.status(404);
    res.send("URL not found");
})


async function initialSanityChecks() {
    /* security checks = is the password set and is not the default? (more checks might come) */
    security.checkKeyIsSet();
    await dbutils.checkMongoWorks(true /* if true means that failure is fatal */);
}

initialSanityChecks();
