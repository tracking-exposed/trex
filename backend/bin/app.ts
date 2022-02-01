/* eslint-disable @typescript-eslint/no-misused-promises */
import { makeBackend } from '@shared/backend';
import { GetLogger } from '@shared/logger';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import * as _ from 'lodash';
import { MongoClient } from 'mongodb';
import { apiList } from '../lib/api';
import mongo3 from '../lib/mongo3';

const logger = GetLogger('api');
const logAPICount = { requests: {}, responses: {}, errors: {} };

function loginc(kind: string, fname: string): void {
  logAPICount[kind][fname] = logAPICount[kind][fname]
    ? logAPICount[kind][fname]++
    : 1;
}

const iowrapper =
  (fname: string) =>
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      loginc('requests', fname);
      const funct = apiList[fname];
      const httpresult = await funct(req, res);

      if (httpresult.headers)
        _.each(httpresult.headers, function (value, key) {
          logger.debug('Setting header %s: %s', key, value);
          res.setHeader(key, value);
        });

      if (!httpresult) {
        logger.debug("API (%s) didn't return anything!?", fname);
        loginc('errors', fname);
        res.send('Fatal error: Invalid output');
        res.status(501);
      } else if (httpresult.json?.error) {
        logger.debug('API (%s) failure, returning 500', fname);
        loginc('errors', fname);
        res.status(500);
        res.json(httpresult.json);
      } else if (httpresult.json) {
        // logger("API (%s) success, returning %d bytes JSON", fname, _.size(JSON.stringify(httpresult.json)));
        loginc('responses', fname);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(httpresult.json);
      } else if (httpresult.text) {
        // logger("API (%s) success, returning text (size %d)", fname, _.size(httpresult.text));
        loginc('responses', fname);
        res.send(httpresult.text);
      } else if (httpresult.status) {
        // logger("Returning empty status %d from API (%s)", httpresult.status, fname);
        loginc('responses', fname);
        res.status(httpresult.status);
      } else {
        logger.debug(
          'Undetermined failure in API (%s) →  %j',
          fname,
          httpresult
        );
        loginc('errors', fname);
        res.status(502);
        res.send('Error?');
      }
    } catch (error) {
      res.status(502);
      res.send('Software error: ' + error.message);
      loginc('errors', fname);
      logger.debug('Error in HTTP handler API(%s): %o', fname, error);
    }
    res.end();
  };

interface MakeAppContext {
  config: {
    port: number;
  };
  mongo: MongoClient;
}

/* one log entry per minute about the amount of API absolved */
setInterval(() => {
  let print = false;
  _.each(_.keys(logAPICount), function (k) {
    if (!_.keys(logAPICount[k]).length)
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete logAPICount[k];
    else print = true;
  });
  if (print) logger.debug('%j', logAPICount);
  logAPICount.responses = {};
  logAPICount.errors = {};
  logAPICount.requests = {};
}, 60 * 1000);

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

  const db = {
    ...mongo3,
    mongo: ctx.mongo,
  };
  const apiRouter = makeBackend({ db, logger }, express.Router());

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

  apiRouter.post('/v3/registerEmail', iowrapper('registerEmail'));

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
  apiRouter.get(
    '/v3/videos/:videoId/recommendations',
    iowrapper('youChooseByVideoId')
  );
  apiRouter.get('/v3/recommendations/:ids', iowrapper('recommendationById'));

  apiRouter.post('/v3/creator/updateVideo', iowrapper('updateVideoRec'));
  apiRouter.post('/v3/creator/ogp', iowrapper('ogpProxy'));
  apiRouter.post('/v3/creator/videos/repull', iowrapper('repullByCreator'));
  apiRouter.get('/v3/creator/videos', iowrapper('getVideoByCreator'));
  apiRouter.get(
    '/v3/creator/videos/:videoId',
    iowrapper('getOneVideoByCreator')
  );
  apiRouter.get('/v3/creator/recommendations', iowrapper('youChooseByProfile'));
  apiRouter.patch(
    '/v3/creator/recommendations/:urlId',
    iowrapper('patchRecommendation')
  );
  apiRouter.get(
    '/v3/creator/:channelId/related',
    iowrapper('getCreatorRelated')
  );
  apiRouter.get('/v3/creator/:channelId/stats', iowrapper('getCreatorStats'));
  apiRouter.delete('/v3/creator/unlink', iowrapper('creatorDelete'));
  apiRouter.get(
    '/v3/opendata/channels/:details?',
    iowrapper('opendataChannel')
  );

  /* below, the few API endpoints */
  apiRouter.post(
    '/v3/creator/:channelId/register',
    iowrapper('creatorRegister')
  );
  apiRouter.post('/v3/creator/:channelId/verify', iowrapper('creatorVerify'));
  apiRouter.get('/v3/creator/me', iowrapper('creatorGet'));

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
  apiRouter.get(
    '/v2/guardoni/list/:directiveType/:key?',
    iowrapper('getAllExperiments')
  );
  apiRouter.post('/v3/directives/:directiveType', iowrapper('postDirective'));
  apiRouter.get('/api/v3/directives/public', iowrapper('getPublicDirectives'));
  apiRouter.get('/v3/directives/:experimentId', iowrapper('fetchDirective'));
  apiRouter.post('/v2/handshake', iowrapper('experimentChannel3'));
  apiRouter.delete(
    '/v3/experiment/:testTime',
    iowrapper('concludeExperiment3')
  );
  apiRouter.get(
    '/v2/experiment/:experimentId/json',
    iowrapper('experimentJSON')
  );
  apiRouter.get(
    '/v2/experiment/:experimentId/csv/:type',
    iowrapper('experimentCSV')
  );
  apiRouter.get('/v2/experiment/:experimentId/dot', iowrapper('experimentDOT'));

  router.use('/api/', apiRouter);

  router.get('*', async (req, res) => {
    logger.debug('URL not handled: %s', req.url);
    res.status(404);
    res.send('URL not found');
  });

  app.use(router);

  app.set('port', ctx.config.port);

  return app;
};
