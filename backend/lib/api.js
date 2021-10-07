
var apiList = {
    processEvents2:   require('../routes/events').processEvents2,
    getMirror:        require('../routes/events').getMirror,

    /* for revision */
    unitById:         require('./htmlunit').unitById,

    /* return basic data, the video-impression unit, and support optional parameters */
    getBasicData:     require('./basic').all,
    /* return the content for one supporter only */
    getSelectedData:  require('./basic').selected,
    /* return contenr formatted for radarChart */
    getRadarData:     require('./basic').radar,

    /* --- from yt -- to become standard --- */
    getLast:          require('../routes/public').getLast,
    getVideoId:       require('../routes/public').getVideoId,
    getRelated:       require('../routes/public').getRelated,
    getVideoCSV:      require('../routes/public').getVideoCSV,
    getHomes:         require('../routes/public').getHomes,
    getHomeCSV:       require('../routes/public').getHomeCSV,

    getRandomRecent:  require('../routes/public').getRandomRecent,

    getByAuthor:      require('../routes/public').getByAuthor,
    getPersonalCSV:   require('../routes/personal').getPersonalCSV,
    getUnwindedHomeCSV:require('../routes/personal').getUnwindedHomeCSV,

    /* return user' last videos */
    getSubmittedRAW:    require('../routes/personal').getSubmittedRAW,
    getPersonal:        require('../routes/personal').getPersonal,
    getPersonalRelated: require('../routes/personal').getPersonalRelated,

    /* personal right of removing your data, and full details on one */
    removeEvidence:    require('../routes/personal').removeEvidence,
    getEvidences:      require('../routes/personal').getEvidences,

    /* impact */
    getStatistics:     require('../routes/statistics').statistics,

    /* self taggging restful approach */
    updateProfile:     require('../routes/profile').updateProfile,
    profileStatus:     require('../routes/profile').profileStatus,
    removeTag:         require('../routes/profile').removeTag,

    /* creation of a new tagGroup */
    createTag:         require('../routes/profile').createTag,

    /* work in progress, admin, tag */
    getMonitor:        require('../routes/monitor').getMonitor,

    /* Q1 2021 researches */
    researchErrors:    require('../routes/research').researchErrors,
    queries:           require('../routes/research').queries,
    queriesCSV:        require('../routes/research').queriesCSV,
    guardoniv1ByMetadata:require('../routes/research').guardoniv1ByMetadata,

    /* Guardoni API */
    guardoniV2:        require('../routes/guardoni').guardoniV2,
};

module.exports = {
    implementations: apiList
};
