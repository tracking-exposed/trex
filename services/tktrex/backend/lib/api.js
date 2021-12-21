
var apiList = {
    processEvents: require('../routes/events').processEvents,
    getMirror: require('../routes/events').getMirror,
    handshake: require('../routes/events').handshake,

    /* for revision */
    unitById: require('../routes/htmlunit').unitById,

    getRecent: require('../routes/public').getRecent,
    getLast: require('../routes/public').getLast,
    getVideoId: require('../routes/public').getVideoId,
    getRelated: require('../routes/public').getRelated,
    getVideoCSV: require('../routes/public').getVideoCSV,

    getPersonal: require('../routes/personal').getPersonal,

    /* impact */
    getStatistics: require('../routes/statistics').statistics,

    /* work in progress, admin, tag */
    getMonitor: require('../routes/monitor').getMonitor,

    /* experiment related APIs */
    getAllExperiments: require('../routes/experiments').list,
    experimentCSV: require('../routes/experiments').csv,
    experimentDOT: require('../routes/experiments').dot,
    experimentJSON: require('../routes/experiments').json,
    experimentChannel3: require('../routes/experiments').channel3,
    concludeExperiment3: require('../routes/experiments').conclude3,
    postDirective: require('../routes/directives').post,
    fetchDirective: require('../routes/directives').get
};

module.exports = {
    apiList
};
