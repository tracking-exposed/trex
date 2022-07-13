import { MakeAppContext } from '@shared/backend/app';
import express from 'express';
import apiList from '../lib/api';
import D from 'debug';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import { routeHandleMiddleware } from '@shared/backend/utils/routeHandlerMiddleware';

export const appLogger = D('tktrex');

const iowrapper = routeHandleMiddleware(apiList);

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
  app.get('/api/v0/health', function (req, res) {
    res.send('OK');
    res.status(200);
  });

  /* This is the API meant to receive data donation */
  app.post('/api/v2/events', iowrapper('processEvents'));
  app.post('/api/v2/apiEvents', iowrapper('processAPIEvents'));
  app.post('/api/v2/handshake', iowrapper('handshake'));

  app.get('/api/v2/recent', iowrapper('getRecent'));

  app.get('/api/v2/statistics/:name/:unit/:amount', iowrapper('getStatistics'));

  /* debug API */
  app.get('/api/v2/debug/html/:htmlId', iowrapper('unitById'));
  app.get('/api/v1/mirror/:key', iowrapper('getMirror'));

  /* monitor for admin */
  app.get('/api/v2/monitor/:minutes?', iowrapper('getMonitor'));

  /* special function for researchers */
  app.get(
    '/api/v2/research/:publicKeyList/:what/csv',
    iowrapper('getResearcherData')
  );

  /* experiments API: at the moment not implemented for tiktok, only copied by yttrex */

  app.get(
    '/api/v2/guardoni/list/:directiveType/:key?',
    iowrapper('getAllExperiments')
  );
  app.get('/api/v3/directives/public', iowrapper('getPublicDirectives'));
  app.post('/api/v3/directives/:directiveType', iowrapper('postDirective'));
  app.get('/api/v3/directives/:experimentId', iowrapper('fetchDirective'));
  app.post('/api/v2/handshake', iowrapper('experimentChannel3'));

  app.get('/api/v2/experiment/:experimentId/json', iowrapper('experimentJSON'));
  app.get(
    '/api/v2/experiment/:experimentId/csv/:type',
    iowrapper('experimentCSV')
  );
  app.get('/api/v2/experiment/:experimentId/dot', iowrapper('experimentDOT'));

  /* subscription email */
  // Improved from the version initially used in ycai, same payload, different behvior:
  // apiRouter.post('/v3/registerEmail', iowrapper('registerEmail2'));
  app.post('/api/v1/registerEmail2', iowrapper('registerEmail2'));
  app.get('/api/v1/listEmails/:key', iowrapper('listEmails'));
  /* ============== Documented only the API below ============== */

  /* TODO the JSON was v1 and should be fixed in site, the what should be a query string, should be timed params */
  app.get(
    '/api/v2/personal/:publicKey/experiments/:experimentId/:format',
    iowrapper('getPersonalByExperimentId')
  );

  app.get(
    '/api/v[1-2]/personal/:publicKey/:what/json',
    iowrapper('getPersonal')
  );
  app.get('/api/v2/personal/:publicKey/:what/csv', iowrapper('getPersonalCSV'));

  /* implemented for DMI winter school, supported in Taboule, trimming in progress */
  app.get('/api/v2/public/searches', iowrapper('getSearches'));
  app.get(
    '/api/v2/public/query/:string/:format',
    iowrapper('getSearchByQuery')
  );
  app.get('/api/v2/public/queries/list', iowrapper('getQueryList'));
  app.get('/api/v2/metadata', iowrapper('listMetadata'));

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
