import * as publicRoutes from '../routes/public';

const apiList = {
  processEvents: require('../routes/events').processEvents,
  processAPIEvents: require('../routes/events').processAPIEvents,
  getMirror: require('../routes/events').getMirror,
  handshake: require('../routes/events').handshake,

  /* for revision */
  unitById: require('../routes/htmlunit').unitById,

  getVideoId: publicRoutes.getVideoId,
  getRelated: publicRoutes.getRelated,
  getVideoCSV: publicRoutes.getVideoCSV,

  /* changes made in emergency during the winter school - might be reviewed */
  getSearches: publicRoutes.getSearches,
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

  /* experiment related APIs -- implemented but not really 
       integrated with guardoni: don't rely on them, they are a 
       simple copy, paritally TypeScripted review, from yt */
  getAllExperiments: require('../routes/experiments').list,
  // experimentCSV:       require('../routes/experiments').csv,
  experimentDOT: require('../routes/experiments').dot,
  experimentJSON: require('../routes/experiments').json,
  experimentChannel3: require('../routes/experiments').channel3,
  concludeExperiment3: require('../routes/experiments').conclude3,
  postDirective: require('../routes/directives').post,
  fetchDirective: require('../routes/directives').get,

  /* and specificly for the email, opt-in, and who wants to be get updated */
  registerEmail: require('../routes/emails').registerEmail,
};

export default apiList;
