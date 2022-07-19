import * as publicRoutes from '../routes/public';
import * as metadataRoutes from '../routes/metadata';
import * as youchooseRoutes from '../routes/youchoose';

export const apiList = {
  systemInfo: require('../routes/system').systemInfo,
  processEvents2: require('../routes/events').processEvents2,
  getMirror: require('../routes/events').getMirror,

  /* for developer support and revision of parsing success|failures */
  unitById: require('../routes/htmlunit').unitById,

  /* the three currently used/tested for the public */
  ...publicRoutes,

  // metadata
  ...metadataRoutes,

  /* searches routes */
  getQueries: require('../routes/searches').getQueries,
  getSearches: require('../routes/searches').getSearches,
  getSearchesCSV: require('../routes/searches').getSearchesCSV,
  getSearchesDot: require('../routes/searches').getSearchesDot,
  getSearchKeywords: require('../routes/searches').getSearchKeywords,
  getSearchDetails: require('../routes/searches').getSearchDetails,

  getPersonalCSV: require('../routes/personal').getPersonalCSV,

  /* return user' last videos */
  getPersonal: require('../routes/personal').getPersonal,
  getPersonalTimeline: require('../routes/personal').getPersonalTimeline,
  getPersonalRelated: require('../routes/personal').getPersonalRelated,
  getPersonalByExperimentId:
    require('../routes/personal').getPersonalByExperimentId,

  /* personal right of removing your data, and full details on one */
  removeEvidence: require('../routes/personal').removeEvidence,
  getEvidences: require('../routes/personal').getEvidences,

  /* researcher functionalities */
  researcher: require('../routes/researcher').researcher,

  /* impact */
  getStatistics: require('../routes/statistics').statistics,

  /* self taggging restful approach */
  updateProfile: require('../routes/profile').updateProfile,
  profileStatus: require('../routes/profile').profileStatus,
  removeTag: require('../routes/profile').removeTag,

  /* creation of a new tagGroup */
  createAndOrJoinTag: require('../routes/profile').createAndOrJoinTag,

  /* realtime monitor */
  getMonitor: require('../routes/monitor').getMonitor,
  deleter: require('../routes/monitor').deleter,

  /* guardoni support for webapp */
  getAllExperiments: require('../routes/experiments').list,
  experimentCSV: require('../routes/experiments').csv,
  experimentDOT: require('../routes/experiments').dot,
  experimentJSON: require('../routes/experiments').json,
  // used from extension
  experimentChannel3: require('../routes/experiments').channel3,
  // used by guardoni to close it

  /* for survey (with emails) */
  recordAnswers: require('../routes/answers').recordAnswers,
  retrieveAnswers: require('../routes/answers').retrieveAnswers,
  retrieveAnswersCSV: require('../routes/answers').retrieveAnswersCSV,
  retrieveMails: require('../routes/answers').retrieveMails,
  /* and specificly for the email, opt-in, and who wants to be get updated */
  registerEmail: require('../routes/emails').registerEmail,

  /* v3 youchoose */
  youChooseByVideoId: youchooseRoutes.byVideoId,
  youChooseByProfile: youchooseRoutes.byProfile,
  patchRecommendation: youchooseRoutes.patchRecommendation,
  ogpProxy: youchooseRoutes.ogpProxy,
  getVideoByCreator: youchooseRoutes.videoByCreator,
  getOneVideoByCreator: youchooseRoutes.oneVideoByCreator,
  repullByCreator: youchooseRoutes.repullByCreator,
  getCreatorRelated: youchooseRoutes.getCreatorRelated,
  recommendationById: youchooseRoutes.getRecommendationById,
  updateVideoRec: youchooseRoutes.updateVideoRec,
  getCreatorStats: youchooseRoutes.getCreatorStats,
  creatorRegister: youchooseRoutes.creatorRegister,
  creatorVerify: youchooseRoutes.creatorVerify,
  creatorGet: youchooseRoutes.creatorGet,
  creatorDelete: youchooseRoutes.creatorDelete,
  /* v3 opendata */
  opendataChannel: require('../routes/opendata').opendataChannel,

  /* v3 chiaroscuro support */
  postDirective: require('../routes/directives').post,
  fetchDirective: require('../routes/directives').get,
  getPublicDirectives: require('../routes/directives').getPublic,

  /* advertising support */
  adsPerVideo: require('../routes/ads').perVideo,
  adsPerChannel: require('../routes/ads').perChannel,
  adsUnbound: require('../routes/ads').unbound,
};
