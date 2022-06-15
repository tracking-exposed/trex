import { MakeAppContext } from '@shared/backend/app';
import express from 'express';
import apiList from '../lib/api';
import D from 'debug';
import cors from 'cors';
import bodyParser from 'body-parser';
import _ from 'lodash';

export const appLogger = D('makhno');

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

  /* This is the primary API, to handle submitted URLs */
  app.post(
    '/api/v1/submit',
    async (req, res) => await iowrapper('submitURL', req, res)
  );

  /* This is the primary alpha API, to retrieve results */
  app.get(
   '/api/v1/results/:urlpattern?',
    async (req, res) => await iowrapper('getResults', req, res)
  );

  app.get(
    '/api/v2/statistics/:name/:unit/:amount',
    async (req, res) => await iowrapper('getStatistics', req, res)
  );

  /* debug API */
  app.get(
    '/api/v2/debug/:urlpattern',
    async (req, res) => await iowrapper('getDebugInfo', req, res)
  );
  app.get(
    '/api/v1/mirror/:key',
    async (req, res) => await iowrapper('getMirror', req, res)
  );

  /* monitor for admin */
  app.get(
    '/api/v1/monitor/:minutes?',
    async (req, res) => await iowrapper('getMonitor', req, res)
  );

  /* subscription email */
  app.post(
    '/api/v1/registerEmail2',
    async (req, res) => await iowrapper('registerEmail2', req, res)
  );
  app.get(
    '/api/v1/listEmails/:key',
    async (req, res) => await iowrapper('listEmails', req, res)
  );

  /* Capture All 404 errors */
  app.get('*', async (req, res) => {
    appLogger('URL not handled: %s', req.url);
    res.status(404);
    res.send('URL not found');
  });
  return app;
};
