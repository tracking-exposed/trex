const apiList = {
  systemInfo: require('../routes/system').systemInfo,
  processEvents2: require('../routes/events').processEvents2,
  getMirror: require('../routes/events').getMirror,

  /* for developer support and revision of parsing success|failures */
  unitById: require('../routes/htmlunit').unitById,

  /* the three currently used/tested for the public */
  getLast: require('../routes/public').getLast,
  getLastHome: require('../routes/public').getLastHome,
  getVideoId: require('../routes/public').getVideoId,
  getRelated: require('../routes/public').getRelated,
  getVideoCSV: require('../routes/public').getVideoCSV,

  /* searches routes */
  getQueries: require('../routes/searches').getQueries,
  getSearches: require('../routes/searches').getSearches,
  getSearchesCSV: require('../routes/searches').getSearchesCSV,
  getSearchesDot: require('../routes/searches').getSearchesDot,
  getSearchKeywords: require('../routes/searches').getSearchKeywords,
  getSearchDetails: require('../routes/searches').getSearchDetails,

  getByAuthor: require('../routes/public').getByAuthor,
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
  experimentEmergencyCSV: require('../routes/experiments').emergency,
  // used from extension
  experimentChannel3: require('../routes/experiments').channel3,
  // used by guardoni to close it
  concludeExperiment3: require('../routes/experiments').conclude3,

  /* for survey (with emails) */
  recordAnswers: require('../routes/answers').recordAnswers,
  retrieveAnswers: require('../routes/answers').retrieveAnswers,
  retrieveAnswersCSV: require('../routes/answers').retrieveAnswersCSV,
  retrieveMails: require('../routes/answers').retrieveMails,
  /* and specificly for the email, opt-in, and who wants to be get updated */
  registerEmail: require('../routes/emails').registerEmail,

  /* v3 youchoose */
  youChooseByVideoId: require('../routes/youchoose').byVideoId,
  youChooseByProfile: require('../routes/youchoose').byProfile,
  patchRecommendation: require('../routes/youchoose').patchRecommendation,
  ogpProxy: require('../routes/youchoose').ogpProxy,
  getVideoByCreator: require('../routes/youchoose').videoByCreator,
  getOneVideoByCreator: require('../routes/youchoose').oneVideoByCreator,
  repullByCreator: require('../routes/youchoose').repullByCreator,
  recommendationById: require('../routes/youchoose').getRecommendationById,
  updateVideoRec: require('../routes/youchoose').updateVideoRec,
  getCreatorRelated: require('../routes/public').getCreatorRelated,
  getCreatorStats: require('../routes/youchoose').getCreatorStats,
  creatorRegister: require('../routes/youchoose').creatorRegister,
  creatorVerify: require('../routes/youchoose').creatorVerify,
  creatorGet: require('../routes/youchoose').creatorGet,
  creatorDelete: require('../routes/youchoose').creatorDelete,
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

module.exports = {
  apiList,
};
