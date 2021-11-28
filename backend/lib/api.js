
var apiList = {
    processEvents:    require('../routes/events').processEvents,
    getMirror:        require('../routes/events').getMirror,
    handshake:        require('../routes/events').handshake,

    /* for revision */
    unitById:         require('../routes/htmlunit').unitById,

    getRecent:        require('../routes/public').getRecent,
    getLast:          require('../routes/public').getLast,
    getVideoId:       require('../routes/public').getVideoId,
    getRelated:       require('../routes/public').getRelated,
    getVideoCSV:      require('../routes/public').getVideoCSV,

    getPersonal:        require('../routes/personal').getPersonal,


    /* impact */
    getStatistics:     require('../routes/statistics').statistics,

    /* work in progress, admin, tag */
    getMonitor:        require('../routes/monitor').getMonitor,

};

module.exports = {
    apiList
};
