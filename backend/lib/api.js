

const apiList = {
    discontinued:     require('../routes/public').discontinued,
    processEvents2:   require('../routes/events').processEvents2,
    getMirror:        require('../routes/events').getMirror,

    /* for revision --- to be determined if kept or not */
    unitById:         require('./htmlunit').unitById,

    /* the three currently used/tested for the public */
    getLast:          require('../routes/public').getLast,
    getVideoId:       require('../routes/public').getVideoId,
    getRelated:       require('../routes/public').getRelated,
    getVideoCSV:      require('../routes/public').getVideoCSV,

    /* searches routes */
    getSearches:      require('../routes/searches').getSearches,
    getSearchKeywords:require('../routes/searches').getSearchKeywords,

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
    createAndOrJoinTag:require('../routes/profile').createAndOrJoinTag,

    /* realtime monitor */
    getMonitor:        require('../routes/monitor').getMonitor,
};

module.exports = {
    implementations: apiList
};
