import * as publicRoutes from '../routes/public';
import * as metadataRoutes from '../routes/metadata';
import * as eventsRoutes from '../routes/events';
import * as experimentsRoutes from '../routes/experiments';
import * as directivesRoutes from '../routes/directives';

const apiList = {
  processEvents: eventsRoutes.processEvents,
  getMirror: eventsRoutes.getMirror,
  handshake: eventsRoutes.handshake,
  getAPIEvents: eventsRoutes.getAPIEvents,

  /* for revision */
  unitById: require('../routes/htmlunit').unitById,

  systemInfo: publicRoutes.systemInfo,
  getRelated: publicRoutes.getRelated,
  getVideoCSV: publicRoutes.getVideoCSV,
  getSearches: publicRoutes.getSearches,
  getVideoId: publicRoutes.getVideoId,
  getRecent: publicRoutes.getRecent,

  ...metadataRoutes,

  /* changes made in emergency during the winter school - might be reviewed */
  getPersonal: require('../routes/personal').getPersonal,
  getPersonalCSV: require('../routes/personal').getPersonalCSV,

  /* Search Queries functions */
  getQueryList: require('../routes/search').getQueryList,
  getSearchByQuery: require('../routes/search').getSearchByQuery,

  getResearcherData: require('../routes/research').getResearcherData,
  /* impact */
  getStatistics: require('../routes/statistics').statistics,

  /* work in progress, admin, tag */
  getMonitor: require('../routes/monitor').getMonitor,

  // experiment related APIs -- implemented but not really
  // integrated with guardoni: don't rely on them, they are a
  // simple copy, paritally TypeScripted review, from yt
  getAllExperiments: experimentsRoutes.list,
  // experimentCSV:       experiementsRoutes.csv,
  experimentDOT: experimentsRoutes.dot,
  experimentJSON: experimentsRoutes.json,
  experimentCSV: experimentsRoutes.csv,
  experimentChannel3: experimentsRoutes.channel3,
  concludeExperiment3: experimentsRoutes.conclude3,
  postDirective: directivesRoutes.post,
  fetchDirective: directivesRoutes.get,
  getPublicDirectives: directivesRoutes.getPublic,
  getPersonalByExperimentId:
    require('../routes/personal').getPersonalByExperimentId,
  /* and specificly for the email, opt-in, and who wants to be get updated */
  registerEmail2: require('../routes/emails').registerEmail2,
  listEmails: require('../routes/emails').listEmails,
};

export default apiList;
