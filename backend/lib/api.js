
var apiListVersion1 = {
    /* POST from the web-extension */
    processEvents:    require('../routes/events').processEvents,
    getMirror:        require('../routes/events').getMirror,

    /* for revision --- to be determined if kept or not */
    unitById:         require('./htmlunit').unitById,

    /* TODO: decide if can be resumed 
    getSequence:      require('./divergency').getSequence,
    createSequence:   require('./divergency').createSequence,
    getResults:       require('./divergency').getResults,
    handshake:        require('./handshake').handshake,
     */

    /* the three currently used/tested for the public */
    getLast:          require('../routes/public').getLast,
    getVideoId:       require('../routes/public').getVideoId,
    getRelated:       require('../routes/public').getRelated,
    getVideoCSV:      require('../routes/public').getVideoCSV,

    // TODO, getAuthor
    getPersonalCSV:   require('../routes/personal').getPersonalCSV,

    /* return user' last videos */
    getPersonal:       require('../routes/personal').getPersonal,

    /* rsync for developer */
    rsync:             require('../routes/rsync').rsync,

    /* researcher functionalities */
    researcher:        require('../routes/researcher').researcher,

    /* impact */
    getStatistics:     require('../routes/statistics').statistics
};

module.exports = {
    implementations: apiListVersion1
};
