#!/usr/bin/env node
import express from 'express';
import { Server } from 'http';
import _ from 'lodash';
import bodyParser from 'body-parser';
import createDebug from 'debug';
import nconf from 'nconf';
import cors from 'cors';

import dbUtils from '../lib/dbutils';
import apiList from '../lib/api';
import security from '../lib/security';

const debug = createDebug('tktrex');

const app = express();
const server = new Server(app);
const cfgFile = "config/settings.json";

nconf.argv().env().file({ file: cfgFile });

console.log("ઉ nconf loaded, using ", cfgFile);

if(!nconf.get('interface') || !nconf.get('port') )
    throw new Error("check your config/settings.json, config of 'interface' and 'post' missing");

async function iowrapper(fname, req, res) {
  try {
    const funct = apiList[fname];
    const httpresult = await funct(req, res);

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
    } else if(httpresult.status) {
        debug("Returning empty status %d from API (%s)", httpresult.status, fname);
        res.status(httpresult.status);
    } else {
        debug("Undetermined failure in API (%s) →  %j", fname, httpresult);
        res.status(502);
        res.send("Error?");
    }
  } catch (error) {
    res.status(505);
    if (error instanceof Error) {
      res.send("Software error: " + error.message);
      debug(
        "Error in HTTP handler API(%s): %s %s",
        fname, error.message, error.stack,
      );
    } else {
      res.send("Unknown software error.");
      debug("Unknown error in HTTP handler API(%s): %s", fname, error);
    }

  }
  res.end();
}

/* everything starts here, welcome */
server.listen(nconf.get('port'), nconf.get('interface'));
console.log(" Listening on http://" + nconf.get('interface') + ":" + nconf.get('port'));
/* configuration of express4 */
app.use(cors());
app.use(bodyParser.json({limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 10 }));

/* this API is v0 as it is platform neutral. it might be shared among
 * all the trex backends, and should return info on system health, echo OK
 * if the system is OK, and the git log of the code running */
app.get('/api/v0/info', async (req, res) => await iowrapper('systemInfo', req, res));
app.get('/api/v0/health', function(req, res) { res.send("OK"); res.status(200); });

/* This is the API meant to receive data donation */
app.post('/api/v2/events', async (req, res) => await iowrapper('processEvents', req, res));
app.post('/api/v2/handshake', async (req, res) => await iowrapper('handshake', req, res));

app.get('/api/v2/recent', async (req, res) => await iowrapper('getRecent', req, res));
/* download your CSV (home or video) */
app.get('/api/v1/personal/:publicKey/:what/:format', async (req, res) => await iowrapper('getPersonal', req, res))

app.get('/api/v2/statistics/:name/:unit/:amount', async (req, res) => await iowrapper('getStatistics', req, res));

/* debug API */
app.get('/api/v2/debug/html/:htmlId', async (req, res) => await iowrapper('unitById', req, res));
app.get('/api/v1/mirror/:key', async (req, res) => await iowrapper('getMirror', req, res));

/* monitor for admin */
app.get('/api/v2/monitor/:minutes?', async (req, res) => await iowrapper('getMonitor', req, res));

/* experiments API: "comparison" require password, "chiaroscuro" doesn't */
app.get(
  "/api/v2/guardoni/list/:directiveType/:key?",
  async (req, res) => await iowrapper("getAllExperiments", req, res),
);
app.post("/api/v3/directives/:directiveType", async (req, res) => await iowrapper("postDirective", req, res));
app.get("/api/v3/directives/:experimentId", async (req, res) => await iowrapper("fetchDirective", req, res));
app.post("/api/v2/handshake", async (req, res) => await iowrapper("experimentChannel3", req, res));
app.delete("/api/v3/experiment/:testTime", async (req, res) => await iowrapper("concludeExperiment3", req, res));
app.get("/api/v2/experiment/:experimentId/json", async (req, res) => await iowrapper("experimentJSON", req, res));
app.get(
  "/api/v2/experiment/:experimentId/csv/:type",
  async (req, res) => await iowrapper("experimentCSV", req, res)
);
app.get("/api/v2/experiment/:experimentId/dot", async (req, res) => await iowrapper("experimentDOT", req, res));

/* Capture All 404 errors */
app.get('*', async (req, res) => {
    debug("URL not handled: %s", req.url);
    res.status(404);
    res.send("URL not found");
})

async function initialSanityChecks() {
    /* security checks = is the password set and is not the default? (more checks might come) */
    security.checkKeyIsSet();
    await dbUtils.checkMongoWorks(true /* if true means that failure is fatal */);
    debug("tiktok.tracking.exposed backend is operative!")
}

initialSanityChecks();
