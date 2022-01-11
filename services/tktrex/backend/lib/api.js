import * as publicRoutes from '../routes/public';

const apiList = {
    processEvents:       require('../routes/events').processEvents,
    getMirror:           require('../routes/events').getMirror,
    handshake:           require('../routes/events').handshake,

    /* for revision */
    unitById:            require('../routes/htmlunit').unitById,

    getVideoId:          publicRoutes.getVideoId,
    getRelated:          publicRoutes.getRelated,
    getVideoCSV:         publicRoutes.getVideoCSV,

    /* changes made in emergency during the winter school - might be reviewed */
    getSearches:         publicRoutes.getSearches,
    getPersonal:         require('../routes/personal').getPersonal,
    getPersonalCSV:      require('../routes/personal').getPersonalCSV,

    /* impact */
    getStatistics:       require('../routes/statistics').statistics,

    /* work in progress, admin, tag */
    getMonitor:          require('../routes/monitor').getMonitor,

    /* experiment related APIs */
    getAllExperiments:   require('../routes/experiments').list,
    // experimentCSV:       require('../routes/experiments').csv,
    experimentDOT:       require('../routes/experiments').dot,
    experimentJSON:      require('../routes/experiments').json,
    experimentChannel3:  require('../routes/experiments').channel3,
    concludeExperiment3: require('../routes/experiments').conclude3,
    postDirective:       require('../routes/directives').post,
    fetchDirective:      require('../routes/directives').get,

};

export default apiList;
