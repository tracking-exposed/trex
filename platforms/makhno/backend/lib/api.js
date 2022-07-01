
const apiList = {
  submitURL: require('../routes/events').submitURL,
  getMirror: require('../routes/events').getMirror,

  /* impact */
  getStatistics: require('../routes/statistics').statistics,

  /* the first two APIs for public consultation */
  getResults: require('../routes/results').getResults,
  getDebugInfo: require('../routes/results').getDebugInfo,

  /* admin only interface for realtime debug */
  getMonitor: require('../routes/monitor').getMonitor,

  /* email APIs, opt-in, and who wants to be updated */
  registerEmail2: require('../routes/emails').registerEmail2,
  listEmails: require('../routes/emails').listEmails,
};

export default apiList;