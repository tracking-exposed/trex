

const apiList = {
    discontinued:     require('../routes/public').discontinued,
    processEvents2:   require('../routes/events').processEvents2,
    getMirror:        require('../routes/events').getMirror,

    /* for developer support and revision of parsing success|failures */
    unitById:         require('../routes/htmlunit').unitById,

    /* the three currently used/tested for the public */
    getLast:          require('../routes/public').getLast,
    getLastHome:      require('../routes/public').getLastHome,
    getVideoId:       require('../routes/public').getVideoId,
    getRelated:       require('../routes/public').getRelated,
    getVideoCSV:      require('../routes/public').getVideoCSV,

    /* searches routes */
    getQueries:       require('../routes/searches').getQueries,
    getSearches:      require('../routes/searches').getSearches,
    getSearchesCSV:   require('../routes/searches').getSearchesCSV,
    getSearchesDot:   require('../routes/searches').getSearchesDot,
    getSearchKeywords:require('../routes/searches').getSearchKeywords,
    getSearchDetails: require('../routes/searches').getSearchDetails,
    updateCampaigns:  require('../routes/searches').updateCampaigns,


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

    /* guardoni support */
    experimentSubmission:require('../routes/experiments').submission,
    experimentCSV:       require('../routes/experiments').csv,
    experimentDOT:       require('../routes/experiments').dot,
    experimentJSON:      require('../routes/experiments').json,

    getAllExperiments:   require('../routes/experiments').list,
    guardoniGenerate:    require('../routes/experiments').guardoniGenerate,
    guardoniConfigure:   require('../routes/experiments').guardoniConfigure,

    recordAnswers:      require('../routes/answers').recordAnswers,
    retrieveAnswers:    require('../routes/answers').retrieveAnswers,
    retrieveAnswersCSV: require('../routes/answers').retrieveAnswersCSV,

    /* v3 youchoose */
    youChooseByVideoId: require('../routes/youchoose').byVideoId,
    ogpProxy:		require('../routes/youchoose').ogpProxy,
};

module.exports = {
    implementations: apiList
};
