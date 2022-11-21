import { MakeAppContext } from '@shared/backend/app';
import express from 'express';
import apiList from '../lib/api';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import { routeHandleMiddleware } from '@shared/backend/utils/routeHandlerMiddleware';
import { makeBackend } from '@shared/backend';
import { RouteContext } from '@shared/backend/types';
import * as mongo3 from '@shared/providers/mongo.provider';
import { GetLogger } from '@shared/logger';

export const appLogger = GetLogger('tktrex');

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

  // get a router instance from express
  const router = express.Router();

  const routeCtx: RouteContext = {
    logger: appLogger,
    db: {
      ...mongo3,
      mongo: ctx.mongo,
    },
  };

  const apiRouter = makeBackend(routeCtx, express.Router());

  /* This is the API meant to receive data donation */
  apiRouter.post('/v2/events', iowrapper('processEvents'));
  apiRouter.post('/v2/apiEvents', iowrapper('processAPIEvents'));
  apiRouter.post('/v2/handshake', iowrapper('handshake'));

  apiRouter.get('/v2/recent', iowrapper('getRecent'));

  apiRouter.get('/v2/statistics/:name/:unit/:amount', iowrapper('getStatistics'));

  /* debug API */
  apiRouter.get('/v2/debug/html/:htmlId', iowrapper('unitById'));
  apiRouter.get('/v1/mirror/:key', iowrapper('getMirror'));

  /* monitor for admin */
  apiRouter.get('/v2/monitor/:minutes?', iowrapper('getMonitor'));

  /* special function for researchers */
  apiRouter.get(
    '/v2/research/:publicKeyList/:what/csv',
    iowrapper('getResearcherData')
  );

  /* experiments API: at the moment not implemented for tiktok, only copied by yttrex */

  apiRouter.get('/v2/guardoni/list', iowrapper('getAllExperiments'));

  apiRouter.get('/api/v2/directives/public', iowrapper('getPublicDirectives'));

  apiRouter.post('/v2/directives', iowrapper('postDirective'));
  apiRouter.get('/v2/directives/:experimentId', iowrapper('fetchDirective'));
  apiRouter.post('/v2/handshake', iowrapper('experimentChannel3'));
  apiRouter.delete('/v2/experiment/:testTime', iowrapper('concludeExperiment3'));
  apiRouter.get('/v2/experiment/:experimentId/json', iowrapper('experimentJSON'));
  // TODO unify the two API below and the one above
  apiRouter.get(
    '/v2/experiment/:experimentId/csv/:type',
    iowrapper('experimentCSV')
  );
  apiRouter.get('/v2/experiment/:experimentId/dot', iowrapper('experimentDOT'));

  /* subscription email */
  apiRouter.post('/v1/registerEmail2', iowrapper('registerEmail2'));
  apiRouter.get('/v1/listEmails/:key', iowrapper('listEmails'));
  /* ============== Documented only the API below ============== */

  /* TODO the JSON was v1 and should be fixed in site, the what should be a query string, should be timed params */
  apiRouter.get(
    '/v2/personal/:publicKey/experiments/:experimentId/:format',
    iowrapper('getPersonalByExperimentId')
  );

  apiRouter.get(
    '/v[1-2]/personal/:publicKey/:what/json',
    iowrapper('getPersonal')
  );
  apiRouter.get('/v2/personal/:publicKey/:what/csv', iowrapper('getPersonalCSV'));

  /* implemented for DMI winter school, supported in Taboule, trimming in progress */
  apiRouter.get('/v2/public/searches', iowrapper('getSearches'));
  apiRouter.get(
    '/v2/public/query/:string/:format',
    iowrapper('getSearchByQuery')
  );
  apiRouter.get('/v2/public/queries/list', iowrapper('getQueryList'));
  apiRouter.get('/v2/metadata', iowrapper('listMetadata'));

  apiRouter.get('/v2/apiEvents', iowrapper('getAPIEvents'));

  /* --------------- end of documented APIs -------------------- */

  /* quick experiment to return static images: nginx might do a better job */
  apiRouter.get('/v0/images/:subd/:fname', (req, res) => {
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

  router.use('/api', apiRouter)

  app.use(router);

  /* Capture All 404 errors */
  app.get('*', async (req, res) => {
    appLogger.debug('URL not handled: %s', req.url);
    res.status(404);
    res.send('URL not found');
  });
  return app;
};
