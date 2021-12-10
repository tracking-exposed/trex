/* eslint-disable @typescript-eslint/no-misused-promises */
import bodyParser from "body-parser";
import cors from "cors";
import debug from "debug";
import express from "express";
import * as _ from "lodash";
import { apiList } from "../lib/api";

const logger = debug('yttrex');

const iowrapper =
  (fname: string) =>
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const funct = apiList[fname];
      const httpresult = await funct(req, res);

      if (httpresult.headers)
        _.each(httpresult.headers, function (value, key) {
          logger("Setting header %s: %s", key, value);
          res.setHeader(key, value);
        });

      if (!httpresult) {
        logger("API (%s) didn't return anything!?", fname);
        res.send("Fatal error: Invalid output");
        res.status(501);
      } else if (httpresult.json?.error) {
        logger("API (%s) failure, returning 500", fname);
        res.status(500);
        res.json(httpresult.json);
      } else if (httpresult.json) {
        logger("API (%s) success, returning %d bytes JSON", fname, _.size(JSON.stringify(httpresult.json)));
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.json(httpresult.json);
      } else if (httpresult.text) {
        logger("API (%s) success, returning text (size %d)", fname, _.size(httpresult.text));
        res.send(httpresult.text);
      } else if (httpresult.status) {
        logger("Returning empty status %d from API (%s)", httpresult.status, fname);
        res.status(httpresult.status);
      } else {
        logger("Undetermined failure in API (%s) →  %j", fname, httpresult);
        res.status(502);
        res.send("Error?");
      }
    } catch (error) {
      res.status(502);
      res.send("Software error: " + error.message);
      logger("Error in HTTP handler API(%s): %o", fname, error);
    }
    res.end();
  };

interface MakeAppContext {
  config: {
    port: number;
  };
}

export const makeApp = (ctx: MakeAppContext): express.Application => {
  const app = express();
  app.use(cors());
  app.options("/api/", cors());
  app.use(bodyParser.json({ limit: "6mb" }));
  app.use(bodyParser.urlencoded({ limit: "6mb", extended: true }));

  /* this API is v0 as it is platform neutral. it might be shared among
   * all the trex backends, and should return info on system health, echo OK
   * if the system is OK, and the git log of the code running */
  app.get("/api/v0/info", iowrapper("systemInfo"));
  app.get("/api/v0/health", function (req, res) {
    res.send("OK");
    res.status(200);
  });

  app.get("/api/v1/last", iowrapper("getLast"));
  app.get("/api/v1/home", iowrapper("getLastHome"));
  app.get("/api/v1/videoId/:videoId", iowrapper("getVideoId"));
  app.get("/api/v1/related/:videoId", iowrapper("getRelated"));
  app.get("/api/v1/videoCSV/:videoId/:amount?", iowrapper("getVideoCSV"));
  app.get("/api/v1/author/:videoId/:amount?", iowrapper("getByAuthor"));

  /* This is the API meant to receive data donation */
  app.post("/api/v2/events", iowrapper("processEvents2"));

  /* new timeline timeseries on top */
  app.get(
    "/api/v1/personal/:publicKey/timeline/:paging?",
    iowrapper("getPersonalTimeline")
  );

  /* download your CSV (home or video) */
  app.get("/api/v2/personal/:publicKey/:type/csv", iowrapper("getPersonalCSV"));

  /* API for researcher: get your related as single list */
  app.get(
    "/api/v1/personal/:publicKey/related/:paging?",
    iowrapper("getPersonalRelated")
  );

  app.post("/api/v3/registerEmail", iowrapper("registerEmail"));

  /* record answers from surveys */
  app.post("/api/v1/recordAnswers", iowrapper("recordAnswers"));
  app.get("/api/v1/retrieveAnswers/:key", iowrapper("retrieveAnswers"));
  app.get(
    "/api/v1/retrieveAnswersCSV/:qName/:key",
    iowrapper("retrieveAnswersCSV")
  );
  app.get("/api/v1/retrieveMails/:key", iowrapper("retrieveMails"));

  /* researcher */
  app.get("/api/v1/wetest/:key/:filter", iowrapper("researcher"));

  /* this return a summary (profile, total amount of videos, last videos, last searches */
  app.get("/api/v1/personal/:publicKey/:paging?", iowrapper("getPersonal"));

  /* action on specific evidence */
  app.delete(
    "/api/v2/personal/:publicKey/selector/id/:id",
    iowrapper("removeEvidence")
  );
  app.get(
    "/api/v2/personal/:publicKey/selector/:key/:value",
    iowrapper("getEvidences")
  );

  /* Update in progress, toward parserv3 */
  app.get("/api/v1/html/:metadataId", iowrapper("unitById"));

  /* monitor and flexible deleter for admin */
  app.get("/api/v2/monitor/:key", iowrapper("getMonitor"));
  app.delete("/api/v2/deleter/:key/:c/:k/:id", iowrapper("deleter"));

  /* admin */
  app.get("/api/v1/mirror/:key", iowrapper("getMirror"));

  /* below, youchoose v3 */
  app.post("/api/v3/handshake", iowrapper("youChooseByVideoId"));
  app.get(
    "/api/v3/video/:videoId/recommendations",
    iowrapper("youChooseByVideoId")
  );
  app.get("/api/v3/recommendations/:ids", iowrapper("recommendationById"));

  app.post("/api/v3/creator/updateVideo", iowrapper("updateVideoRec"));
  app.post("/api/v3/creator/ogp", iowrapper("ogpProxy"));
  app.post("/api/v3/creator/videos/repull", iowrapper("repullByCreator"));
  app.get("/api/v3/creator/videos", iowrapper("getVideoByCreator"));
  app.get("/api/v3/creator/videos/:videoId", iowrapper("getOneVideoByCreator"));
  app.get("/api/v3/creator/recommendations", iowrapper("youChooseByProfile"));
  app.patch("/api/v3/creator/recommendations/:urlId", iowrapper("patchRecommendation"));
  app.get(
    "/api/v3/creator/:channelId/related/:amount?",
    iowrapper("getCreatorRelated")
  );
  app.get("/api/v3/creator/:channelId/stats", iowrapper("getCreatorStats"));
  app.delete("/api/v3/creator/unlink", iowrapper("creatorDelete"));
  app.get("/api/v3/opendata/channels/:details?", iowrapper("opendataChannel"));

  /* below, the few API endpoints */
  app.post("/api/v3/creator/:channelId/register", iowrapper("creatorRegister"));
  app.post("/api/v3/creator/:channelId/verify", iowrapper("creatorVerify"));
  app.get("/api/v3/creator/me", iowrapper("creatorGet"));

  /* below, the new API for advertising */
  app.get("/api/v2/ad/video/:videoId", iowrapper("adsPerVideo"));
  app.get("/api/v2/ad/channel/:channelId", iowrapper("adsPerChannel"));
  app.get("/api/v2/ad/:amount?", iowrapper("adsUnbound"));

  /* impact */
  app.get("/api/v2/statistics/:name/:unit/:amount", iowrapper("getStatistics"));

  /* delete a group from your profile, create a new tagId --- outdated, verify */
  app.delete("/api/v2/profile/:publicKey/tag/:tagName", iowrapper("removeTag"));
  app.post("/api/v2/profile/:publicKey/tag", iowrapper("createAndOrJoinTag"));

  /* update and current profile  --- outdated, verify. */
  app.get("/api/v2/profile/:publicKey/tag", iowrapper("profileStatus"));
  app.post("/api/v2/profile/:publicKey", iowrapper("updateProfile"));

  /* to get results of search queries! -- to be retested, CSV is OK, but perhaps only it. */
  app.get("/api/v2/searches/:idList/dot", iowrapper("getSearchesDot"));
  app.get("/api/v2/searches/:query/CSV", iowrapper("getSearchesCSV"));
  app.get("/api/v2/queries/:campaignName", iowrapper("getQueries"));
  app.get("/api/v2/searches/:query/:paging?", iowrapper("getSearches"));
  app.get("/api/v2/searchid/:listof", iowrapper("getSearchDetails"));
  app.get("/api/v2/search/keywords/:paging?", iowrapper("getSearchKeywords"));

  /* experiments API: "comparison" require password, "chiaroscuro" doesn't */
  app.get(
    "/api/v2/guardoni/list/:directiveType/:key?",
    iowrapper("getAllExperiments")
  );
  app.post("/api/v3/directives/:directiveType", iowrapper("postDirective"));
  app.get("/api/v3/directives/:experimentId", iowrapper("fetchDirective"));
  app.post("/api/v2/handshake", iowrapper("experimentChannel3"));
  app.delete("/api/v3/experiment/:testTime", iowrapper("concludeExperiment3"));
  app.get("/api/v2/experiment/:experimentId/json", iowrapper("experimentJSON"));
  app.get(
    "/api/v2/experiment/:experimentId/csv/:type",
    iowrapper("experimentCSV")
  );
  app.get("/api/v2/experiment/:experimentId/dot", iowrapper("experimentDOT"));

  app.get("*", async (req, res) => {
    logger("URL not handled: %s", req.url);
    res.status(404);
    res.send("URL not found");
  });

  app.set('port', ctx.config.port);

  return app;
};
