import * as publicRoutes from '../routes/public';
import * as metadataRoutes from '../routes/metadata';
import * as eventsRoutes from '../routes/events';
import * as experimentsRoutes from '../routes/experiments';
import * as directivesRoutes from '../routes/directives';
import * as sigiStatesRoutes from '../routes/sigiStates';
import * as personalRoutes from '../routes/personal';
import * as searchRoutess from '../routes/search';
import * as emailsRoutes from '../routes/emails';
import * as htmlunitRoutes from '../routes/htmlunit';
import * as apiRequestsRoutes from '../routes/apiRequests';
import * as researchRoutes from '../routes/research';
import * as statisticsRoutes from '../routes/statistics';
import * as monitorRoutes from '../routes/monitor';

const apiList = {
  processEvents: eventsRoutes.processEvents,
  getMirror: eventsRoutes.getMirror,
  handshake: eventsRoutes.handshake,

  /* for revision */
  unitById: htmlunitRoutes.unitById,

  getRelated: publicRoutes.getRelated,
  getVideoCSV: publicRoutes.getVideoCSV,
  getSearches: publicRoutes.getSearches,
  getVideoId: publicRoutes.getVideoId,
  getRecent: publicRoutes.getRecent,

  getAPIRequests: apiRequestsRoutes.getAPIRequests,
  getSigiStates: sigiStatesRoutes.getSigiStates,

  ...metadataRoutes,

  /* changes made in emergency during the winter school - might be reviewed */
  getPersonal: personalRoutes.getPersonal,
  getPersonalCSV: personalRoutes.getPersonalCSV,

  /* Search Queries functions */
  getQueryList: searchRoutess.getQueryList,
  getSearchByQuery: searchRoutess.getSearchByQuery,

  getResearcherData: researchRoutes.getResearcherData,
  /* impact */
  getStatistics: statisticsRoutes.statistics,

  /* work in progress, admin, tag */
  getMonitor: monitorRoutes.getMonitor,

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
  getPersonalByExperimentId: personalRoutes.getPersonalByExperimentId,
  /* and specificly for the email, opt-in, and who wants to be get updated */
  registerEmail2: emailsRoutes.registerEmail2,
  listEmails: emailsRoutes.listEmails,
};

export default apiList;
