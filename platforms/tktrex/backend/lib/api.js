import * as publicRoutes from '../routes/public';
import * as metadataRoutes from '../routes/metadata';

const apiList = {
  processEvents: require('../routes/events').processEvents,
  processAPIEvents: require('../routes/events').processAPIEvents,
  getMirror: require('../routes/events').getMirror,
  handshake: require('../routes/events').handshake,

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
  getAllExperiments: require('../routes/experiments').list,
  // experimentCSV:       require('../routes/experiments').csv,
  experimentDOT: require('../routes/experiments').dot,
  experimentJSON: require('../routes/experiments').json,
  experimentCSV: require('../routes/experiments').csv,
  experimentChannel3: require('../routes/experiments').channel3,
  concludeExperiment3: require('../routes/experiments').conclude3,
  postDirective: require('../routes/directives').post,
  fetchDirective: require('../routes/directives').get,
  getPublicDirectives: require('../routes/directives').getPublic,
  getPersonalByExperimentId:
    require('../routes/personal').getPersonalByExperimentId,
  /* and specificly for the email, opt-in, and who wants to be get updated */
  registerEmail2: require('../routes/emails').registerEmail2,
  listEmails: require('../routes/emails').listEmails,
};

export default apiList;
