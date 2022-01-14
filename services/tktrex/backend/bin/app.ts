import path from 'path';

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import _ from 'lodash';

import apiList from '../lib/api';
import { addTikTokRoutes } from '@shared/backend/router-enhancers/TikTok';
import mongo3 from '../lib/mongo3';

const hasProp = <T extends unknown>(x:T, key: string)
:x is T & { [key: string]: unknown } =>
  x && typeof x === 'object' &&
    Object.hasOwnProperty.call(x, key);

const makeIOWrapper = ({ debug }) => async(
  fname: string,
  req: Request,
  res: Response,
) => {
  try {
    const funct: (r: Request, x: Response) => unknown = apiList[fname];
    const httpresult = await funct(req, res);

    if (hasProp(httpresult, 'headers')) {
      const headers = typeof httpresult.headers === 'object'
        && httpresult.headers ? httpresult.headers : {};

        _.each(headers, function(value, key) {
          debug("Setting header %s: %s", key, value);
          res.setHeader(key, value);
        });
    }

    if (!httpresult) {
      debug("API (%s) didn't return anything!?", fname);
      res.send("Fatal error: Invalid output");
      res.status(501);
      return;
    }

    const result: any = httpresult;

    if (result.json?.error) {
      debug("API (%s) failure, returning 500", fname);
      res.status(500);
      res.json(result.json);
    } else if (result.json) {
      const json = JSON.stringify(result.json || {});
      debug("API (%s) success, returning %d bytes JSON, %s",
        fname, _.size(json), json);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(result.json);
    } else if (result.text) {
      debug("API (%s) success, returning text (size %d)", fname, _.size(result.text));
      res.send(result.text);
    } else if(result.status) {
      debug("Returning empty status %d from API (%s)", (result).status, fname);
      res.status(result.status);
    } else {
      debug("Undetermined failure in API (%s) →  %j", fname, httpresult);
      res.status(502);
      res.send("Error?");
    }
  } catch (error) {
    if (error instanceof Error) {
      debug(
        "Error in HTTP handler API(%s): %s %s",
        fname, error.message, error.stack,
      );
      res.status(505);
      res.send("Software error: " + error.message);
    } else {
      res.status(502);
      res.send("Unknown software error.");
    }
  }
}

export const makeApp = async({
  debug,
}): Promise<Express.Application> => {
  const iowrapper = makeIOWrapper({ debug });

  const client = await mongo3.clientConnect();
  if (!client) {
    console.error('Could not connect to MongoDB');
    process.exit(1);
  }

  const app = express();

  // configure express middlewares
  app.use(cors());
  app.use(bodyParser.json({limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 10 }));

  // add new TikTok routes
  const apiRouter = addTikTokRoutes({
    db: { ...mongo3, client },
    logger: debug,
  }, express.Router());

  // add legacy routes

  /* this API is v0 as it is platform neutral. it might be shared among
   * all the trex backends, and should return info on system health, echo OK
   * if the system is OK, and the git log of the code running */
  apiRouter.get('/api/v0/info', async (req, res) => await iowrapper('systemInfo', req, res));
  apiRouter.get('/api/v0/health', function(req, res) { res.send("OK"); res.status(200); });

  /* This is the API meant to receive data donation */
  apiRouter.post('/api/v2/events', async (req, res) => await iowrapper('processEvents', req, res));
  apiRouter.post('/api/v2/handshake', async (req, res) => await iowrapper('handshake', req, res));

  apiRouter.get('/api/v2/recent', async (req, res) => await iowrapper('getRecent', req, res));

  /* note this is kept v1 because initially personal page was pulling here; but TODO should be v2 */
  apiRouter.get('/api/v1/personal/:publicKey/:what/json', async (req, res) => await iowrapper('getPersonal', req, res))
  /* download your CSV (only search is supported at the moment) */
  apiRouter.get('/api/v2/personal/:publicKey/:what/csv', async (req, res) => await iowrapper('getPersonalCSV', req, res))

  apiRouter.get('/api/v2/statistics/:name/:unit/:amount', async (req, res) => await iowrapper('getStatistics', req, res));

  /* debug API */
  apiRouter.get('/api/v2/debug/html/:htmlId', async (req, res) => await iowrapper('unitById', req, res));
  apiRouter.get('/api/v1/mirror/:key', async (req, res) => await iowrapper('getMirror', req, res));

  /* monitor for admin */
  apiRouter.get('/api/v2/monitor/:minutes?', async (req, res) => await iowrapper('getMonitor', req, res));

  /* experiments API: at the moment not implemented for tiktok, only copied by yttrex */
  apiRouter.get(
    "/api/v2/guardoni/list/:directiveType/:key?",
    async (req, res) => await iowrapper("getAllExperiments", req, res),
  );
  apiRouter.post("/api/v3/directives/:directiveType", async (req, res) => await iowrapper("postDirective", req, res));
  apiRouter.get("/api/v3/directives/:experimentId", async (req, res) => await iowrapper("fetchDirective", req, res));
  apiRouter.post("/api/v2/handshake", async (req, res) => await iowrapper("experimentChannel3", req, res));
  apiRouter.delete("/api/v3/experiment/:testTime", async (req, res) => await iowrapper("concludeExperiment3", req, res));
  apiRouter.get("/api/v2/experiment/:experimentId/json", async (req, res) => await iowrapper("experimentJSON", req, res));
  apiRouter.get(
    "/api/v2/experiment/:experimentId/csv/:type",
    async (req, res) => await iowrapper("experimentCSV", req, res)
  );
  apiRouter.get("/api/v2/experiment/:experimentId/dot", async (req, res) => await iowrapper("experimentDOT", req, res));

  /* implemented right before DMI winter school */
  apiRouter.get("/api/v2/searches", async (req, res) => await iowrapper("getSearches", req, res));
  /* used in /search page for comparison of specific queries */
  apiRouter.get("/api/v2/query/:string/:format", async (req, res) => await iowrapper("getSearchByQuery", req, res));
  apiRouter.get("/api/v2/queries/list", async (req, res) => await iowrapper("getQueryList", req, res));

  /* quick experiment to return static images: nginx might do a better job */
  apiRouter.get("/api/v0/images/:subd/:fname", (req, res) => {
    res.sendFile(
      path.join(process.cwd(),
        "downloads", "thumbnail", req.params.subd, req.params.fname)
      );
  });

  /* Capture All 404 errors */
  apiRouter.get('*', async (req, res) => {
      debug("URL not handled: %s", req.url);
      res.status(404);
      res.send("URL not found");
  });

  app.use(apiRouter);

  return app;
};

export default makeApp;
