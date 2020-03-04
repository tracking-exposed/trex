/*
const nextApiList = [
  {
    implementation: require('../routes/events').processEvents,
    method: 'POST',
    path: '/events/:some?',
    validation: {
      'some': validate.
    },
    name: 'processEvents'
}, {
} ]; */

var apiListVersion1 = {
    /* POST from the web-extension */
    processEvents:    require('../routes/events').processEvents,
    /* processInput is the second version of events */
    processEvents2:   require('../routes/events').processEvents2,
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

    getByAuthor:      require('../routes/public').getByAuthor,
    getPersonalCSV:   require('../routes/personal').getPersonalCSV,

    /* return user' last videos */
    getPersonal:        require('../routes/personal').getPersonal,
    getPersonalTimeline: require('../routes/personal').getPersonalTimeline,
    getPersonalRelated: require('../routes/personal').getPersonalRelated,

    /* personal right of removing your data, and full details on one */
    removeEvidence:    require('../routes/personal').removeEvidence,
    getEvidences:      require('../routes/personal').getEvidences,

    /* rsync for developer, overthrown by 'mirror' */
    rsync:             require('../routes/rsync').rsync,

    /* researcher functionalities */
    researcher:        require('../routes/researcher').researcher,

    /* impact */
    getStatistics:     require('../routes/statistics').statistics,

    /* self taggging restful approach */
    updateProfile:     require('../routes/profile').updateProfile,
    profileStatus:     require('../routes/profile').profileStatus,
    removeTag:         require('../routes/profile').removeTag,

    /* creation of a new tagGroup */
    createTag:         require('../routes/profile').createTag,

    /* realtime monitor */
    getMonitor:        require('../routes/monitor').getMonitor,
};

module.exports = {
    implementations: apiListVersion1
};
