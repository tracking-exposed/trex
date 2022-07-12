import { MakeAppContext } from '@shared/backend/app';
import express from 'express';
import apiList from '../lib/api';
import D from 'debug';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import _ from 'lodash';

export const appLogger = D('tktrex');

async function iowrapper(fname, req, res): Promise<void> {
  try {
    const funct = apiList[fname];
    const httpresult = await funct(req, res);

    if (httpresult.headers)
      _.each(httpresult.headers, function (value, key) {
        appLogger('Setting header %s: %s', key, value);
        res.setHeader(key, value);
      });

    if (!httpresult) {
      appLogger("API (%s) didn't return anything!?", fname);
      res.send('Fatal error: Invalid output');
      res.status(501);
    } else if (httpresult.json?.error) {
      appLogger('API (%s) failure, returning 500', fname);
      res.status(500);
      res.json(httpresult.json);
    } else if (httpresult.json) {
      appLogger(
        'API (%s) success, returning %d bytes JSON',
        fname,
        _.size(JSON.stringify(httpresult.json))
      );
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(httpresult.json);
    } else if (httpresult.text) {
      appLogger(
        'API (%s) success, returning text (size %d)',
        fname,
        _.size(httpresult.text)
      );
      res.send(httpresult.text);
    } else if (httpresult.status) {
      appLogger(
        'Returning empty status %d from API (%s)',
        httpresult.status,
        fname
      );
      res.status(httpresult.status);
    } else {
      appLogger('Undetermined failure in API (%s) →  %j', fname, httpresult);
      res.status(502);
      res.send('Error?');
    }
  } catch (error) {
    res.status(505);
    if (error instanceof Error) {
      res.send('Software error: ' + error.message);
      appLogger(
        'Error in HTTP handler API(%s): %s %s',
        fname,
        error.message,
        error.stack
      );
    } else {
      res.send('Unknown software error.');
      appLogger('Unknown error in HTTP handler API(%s): %s', fname, error);
    }
  }
  res.end();
}

export const makeApp = async (
  ctx: MakeAppContext
): Promise<express.Application> => {
  const app = express();
  /* configuration of express4 */
  app.use(cors());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(
    bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 10 })
  );

  /* this API is v0 as it is platform neutral. it might be shared among
   * all the trex backends, and should return info on system health, echo OK
   * if the system is OK, and the git log of the code running */
  app.get(
    '/api/v0/info',
    async (req, res) => await iowrapper('systemInfo', req, res)
  );
  app.get('/api/v0/health', function (req, res) {
    res.send('OK');
    res.status(200);
  });

  /* This is the API meant to receive data donation */
  app.post(
    '/api/v2/events',
    async (req, res) => await iowrapper('processEvents', req, res)
  );
  app.post(
    '/api/v2/apiEvents',
    async (req, res) => await iowrapper('processAPIEvents', req, res)
  );
  app.post(
    '/api/v2/handshake',
    async (req, res) => await iowrapper('handshake', req, res)
  );

  app.get(
    '/api/v2/recent',
    async (req, res) => await iowrapper('getRecent', req, res)
  );

  app.get(
    '/api/v2/statistics/:name/:unit/:amount',
    async (req, res) => await iowrapper('getStatistics', req, res)
  );

  /* debug API */
  app.get(
    '/api/v2/debug/html/:htmlId',
    async (req, res) => await iowrapper('unitById', req, res)
  );
  app.get(
    '/api/v1/mirror/:key',
    async (req, res) => await iowrapper('getMirror', req, res)
  );

  /* monitor for admin */
  app.get(
    '/api/v2/monitor/:minutes?',
    async (req, res) => await iowrapper('getMonitor', req, res)
  );

  /* special function for researchers */
  app.get(
    '/api/v2/research/:publicKeyList/:what/csv',
    async (req, res) => await iowrapper('getResearcherData', req, res)
  );

  /* experiments API: at the moment not implemented for tiktok, only copied by yttrex */

  app.get(
    '/api/v2/guardoni/list/:directiveType/:key?',
    async (req, res) => await iowrapper('getAllExperiments', req, res)
  );
  app.get('/api/v3/directives/public', async (req, res) =>
    iowrapper('getPublicDirectives', req, res)
  );
  app.post(
    '/api/v3/directives/:directiveType',
    async (req, res) => await iowrapper('postDirective', req, res)
  );
  app.get(
    '/api/v3/directives/:experimentId',
    async (req, res) => await iowrapper('fetchDirective', req, res)
  );
  app.post(
    '/api/v2/handshake',
    async (req, res) => await iowrapper('experimentChannel3', req, res)
  );

  app.get(
    '/api/v2/experiment/:experimentId/json',
    async (req, res) => await iowrapper('experimentJSON', req, res)
  );
  app.get(
    '/api/v2/experiment/:experimentId/csv/:type',
    async (req, res) => await iowrapper('experimentCSV', req, res)
  );
  app.get(
    '/api/v2/experiment/:experimentId/dot',
    async (req, res) => await iowrapper('experimentDOT', req, res)
  );

  /* subscription email */
  // Improved from the version initially used in ycai, same payload, different behvior:
  // apiRouter.post('/v3/registerEmail', iowrapper('registerEmail2'));
  app.post(
    '/api/v1/registerEmail2',
    async (req, res) => await iowrapper('registerEmail2', req, res)
  );
  app.get(
    '/api/v1/listEmails/:key',
    async (req, res) => await iowrapper('listEmails', req, res)
  );
  /* ============== Documented only the API below ============== */

  /* TODO the JSON was v1 and should be fixed in site, the what should be a query string, should be timed params */
  app.get(
    '/api/v2/personal/:publicKey/experiments/:experimentId/:format',
    async (req, res) => await iowrapper('getPersonalByExperimentId', req, res)
  );

  app.get(
    '/api/v[1-2]/personal/:publicKey/:what/json',
    async (req, res) => await iowrapper('getPersonal', req, res)
  );
  app.get(
    '/api/v2/personal/:publicKey/:what/csv',
    async (req, res) => await iowrapper('getPersonalCSV', req, res)
  );

  /* implemented for DMI winter school, supported in Taboule, trimming in progress */
  app.get(
    '/api/v2/public/searches',
    async (req, res) => await iowrapper('getSearches', req, res)
  );
  app.get(
    '/api/v2/public/query/:string/:format',
    async (req, res) => await iowrapper('getSearchByQuery', req, res)
  );
  app.get(
    '/api/v2/public/queries/list',
    async (req, res) => await iowrapper('getQueryList', req, res)
  );

  /* --------------- end of documented APIs -------------------- */

  /* quick experiment to return static images: nginx might do a better job */
  app.get('/api/v0/images/:subd/:fname', (req, res) => {
    res.sendFile(
      path.join(
        process.cwd(),
        'downloads',
        'thumbnail',
        req.params.subd,
        req.params.fname
      )
    );
  });

  /* Capture All 404 errors */
  app.get('*', async (req, res) => {
    appLogger('URL not handled: %s', req.url);
    res.status(404);
    res.send('URL not found');
  });
  return app;
};
