/* eslint-disable @typescript-eslint/no-misused-promises */
import { makeBackend } from '@shared/backend';
import { MakeAppContext } from '@shared/backend/app';
import { RouteContext } from '@shared/backend/types';
import { GetLogger } from '@shared/logger';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { apiList } from '../lib/api';
import * as mongo3 from '@shared/providers/mongo.provider';
import { DeleteRecommendationRoute } from '../routes/youchoose/deleteRecommendation.route';
import { routeHandleMiddleware } from '@shared/backend/utils/routeHandlerMiddleware';

const logger = GetLogger('api');

const iowrapper = routeHandleMiddleware(apiList);

/* one log entry per minute about the amount of API absolved */

export const makeApp = async (
  ctx: MakeAppContext
): Promise<express.Application> => {
  const app = express();

  app.use(cors());
  app.options('/api/', cors());
  app.use(bodyParser.json({ limit: '6mb' }));
  app.use(bodyParser.urlencoded({ limit: '6mb', extended: true }));

  // get a router instance from express
  const router = express.Router();

  const routeCtx: RouteContext = {
    logger,
    db: {
      ...mongo3,
      mongo: ctx.mongo,
    },
  };
  const apiRouter = makeBackend(routeCtx, express.Router());

  DeleteRecommendationRoute(apiRouter, routeCtx);

  /* this API is v0 as it is platform neutral. it might be shared among
   * all the trex backends, and should return info on system health, echo OK
   * if the system is OK, and the git log of the code running */
  apiRouter.get('/v0/info', iowrapper('systemInfo'));
  apiRouter.get('/v1/last', iowrapper('getLast'));
  apiRouter.get('/v1/home', iowrapper('getLastHome'));
  apiRouter.get('/v1/videoId/:videoId', iowrapper('getVideoId'));
  apiRouter.get('/v1/related/:videoId', iowrapper('getRelated'));
  apiRouter.get('/v1/videoCSV/:videoId/:amount?', iowrapper('getVideoCSV'));
  apiRouter.get('/v1/author/:videoId/:amount?', iowrapper('getByAuthor'));

  /* This is the API meant to receive data donation */
  apiRouter.post('/v2/events', iowrapper('processEvents2'));

  /* new timeline timeseries on top */
  apiRouter.get(
    '/v1/personal/:publicKey/timeline/:paging?',
    iowrapper('getPersonalTimeline')
  );

  /* download your CSV (home or video) */
  apiRouter.get(
    '/v2/personal/:publicKey/:type/csv',
    iowrapper('getPersonalCSV')
  );

  /* API for researcher: get your related as single list */
  apiRouter.get(
    '/v1/personal/:publicKey/related/:type/:paging?',
    iowrapper('getPersonalRelated')
  );

  /** List personal metadata by experiment id */
  apiRouter.get(
    '/v2/personal/:publicKey/experiments/:experimentId/:format',
    iowrapper('getPersonalByExperimentId')
  );

  apiRouter.post('/v2/registerEmail', iowrapper('registerEmail'));

  /* record answers from surveys */
  apiRouter.post('/v1/recordAnswers', iowrapper('recordAnswers'));
  apiRouter.get('/v1/retrieveAnswers/:key', iowrapper('retrieveAnswers'));
  apiRouter.get(
    '/v1/retrieveAnswersCSV/:qName/:key',
    iowrapper('retrieveAnswersCSV')
  );
  apiRouter.get('/v1/retrieveMails/:key', iowrapper('retrieveMails'));

  /* researcher */
  apiRouter.get('/v1/wetest/:key/:filter', iowrapper('researcher'));

  /* this return a summary (profile, total amount of videos, last videos, last searches */
  apiRouter.get('/v1/personal/:publicKey/:paging?', iowrapper('getPersonal'));

  /* action on specific evidence */
  apiRouter.delete(
    '/v2/personal/:publicKey/selector/id/:id',
    iowrapper('removeEvidence')
  );
  apiRouter.get(
    '/v2/personal/:publicKey/selector/:key/:value',
    iowrapper('getEvidences')
  );

  /* Update in progress, toward parserv3 */
  apiRouter.get('/v1/html/:metadataId', iowrapper('unitById'));

  /* monitor and flexible deleter for admin */
  apiRouter.get('/v2/monitor/:key', iowrapper('getMonitor'));
  apiRouter.delete('/v2/deleter/:key/:c/:k/:id', iowrapper('deleter'));

  /* admin */
  apiRouter.get('/v1/mirror/:key', iowrapper('getMirror'));

  /* below, youchoose v3 */
  const youchooseRouter = express.Router();

  youchooseRouter.get(
    '/v3/videos/:videoId/recommendations',
    iowrapper('youChooseByVideoId')
  );
  youchooseRouter.get(
    '/v3/recommendations/:ids',
    iowrapper('recommendationById')
  );

  youchooseRouter.post('/v3/creator/updateVideo', iowrapper('updateVideoRec'));
  youchooseRouter.post('/v3/creator/ogp', iowrapper('ogpProxy'));
  youchooseRouter.post(
    '/v3/creator/videos/repull',
    iowrapper('repullByCreator')
  );
  youchooseRouter.get('/v3/creator/videos', iowrapper('getVideoByCreator'));
  youchooseRouter.get(
    '/v3/creator/videos/:videoId',
    iowrapper('getOneVideoByCreator')
  );
  youchooseRouter.get(
    '/v3/creator/recommendations',
    iowrapper('youChooseByProfile')
  );
  youchooseRouter.patch(
    '/v3/creator/recommendations/:urlId',
    iowrapper('patchRecommendation')
  );
  youchooseRouter.get(
    '/v3/creator/:channelId/related',
    iowrapper('getCreatorRelated')
  );
  youchooseRouter.get(
    '/v3/creator/:channelId/stats',
    iowrapper('getCreatorStats')
  );
  youchooseRouter.delete('/v3/creator/unlink', iowrapper('creatorDelete'));
  youchooseRouter.get(
    '/v3/opendata/channels/:details?',
    iowrapper('opendataChannel')
  );
  youchooseRouter.post(
    '/v3/creator/:channelId/register',
    iowrapper('creatorRegister')
  );
  youchooseRouter.post(
    '/v3/creator/:channelId/verify',
    iowrapper('creatorVerify')
  );
  youchooseRouter.get('/v3/creator/me', iowrapper('creatorGet'));

  apiRouter.use(youchooseRouter);

  /* below, the new API for advertising */
  apiRouter.get('/v2/ad/video/:videoId', iowrapper('adsPerVideo'));
  apiRouter.get('/v2/ad/channel/:channelId', iowrapper('adsPerChannel'));
  apiRouter.get('/v2/ad/:amount?', iowrapper('adsUnbound'));

  /* impact */
  apiRouter.get(
    '/v2/statistics/:name/:unit/:amount',
    iowrapper('getStatistics')
  );

  /* delete a group from your profile, create a new tagId --- outdated, verify */
  apiRouter.delete(
    '/v2/profile/:publicKey/tag/:tagName',
    iowrapper('removeTag')
  );
  apiRouter.post('/v2/profile/:publicKey/tag', iowrapper('createAndOrJoinTag'));

  /* update and current profile  --- outdated, verify. */
  apiRouter.get('/v2/profile/:publicKey/tag', iowrapper('profileStatus'));
  apiRouter.post('/v2/profile/:publicKey', iowrapper('updateProfile'));

  /* to get results of search queries! -- to be retested, CSV is OK, but perhaps only it. */
  apiRouter.get('/v2/searches/:idList/dot', iowrapper('getSearchesDot'));
  apiRouter.get('/v2/searches/:query/CSV', iowrapper('getSearchesCSV'));
  apiRouter.get('/v2/queries/:campaignName', iowrapper('getQueries'));
  apiRouter.get('/v2/searches/:query/:paging?', iowrapper('getSearches'));
  apiRouter.get('/v2/searchid/:listof', iowrapper('getSearchDetails'));
  apiRouter.get('/v2/search/keywords/:paging?', iowrapper('getSearchKeywords'));

  /* experiments API: "comparison" require password, "chiaroscuro" doesn't */
  apiRouter.get('/v2/guardoni/list', iowrapper('getAllExperiments'));
  apiRouter.get('/v2/directives/public', iowrapper('getPublicDirectives'));
  apiRouter.post('/v2/directives/:ignored?', iowrapper('postDirective'));
  apiRouter.get('/v2/directives/:experimentId', iowrapper('fetchDirective'));
  apiRouter.post('/v2/handshake', iowrapper('experimentChannel3'));

  apiRouter.get(
    '/v2/experiment/:experimentId/json',
    iowrapper('experimentJSON')
  );
  apiRouter.get(
    '/v2/experiment/:experimentId/csv/:type',
    iowrapper('experimentCSV')
  );
  apiRouter.get('/v2/experiment/:experimentId/dot', iowrapper('experimentDOT'));

  /**
   * Metadata
   */

  apiRouter.get('/v2/metadata', iowrapper('listMetadata'));

  router.use('/api/', apiRouter);

  router.get('*', async (req, res) => {
    logger.debug('URL not handled: %s (%s)', req.url, req.method);
    res.status(404);
    res.send('URL not found');
  });

  app.use(router);

  app.set('port', ctx.config.port);

  return app;
};
