
var apiListVersion1 = {
    /* POST from the userscript */
    processEvents:    require('./events').processEvents,

    /* not API, serving static pages from sections/*.pug */
    getPage:          require('./staticpages').getPage,

    /* for revision */
    unitById:         require('./htmlunit').unitById,

    /* return user' last videos info */
    getPersonalBlob:  require('./personal').getPersonalBlob,

    /* return user' last videos info */
    getUserBacklog:   require('./backlog').getUserBacklog,

    /* retuern sequence of video for divergency check */
    getSequence:      require('./divergency').getSequence,
    createSequence:   require('./divergency').createSequence,
    getResults:       require('./divergency').getResults,

    handshake:        require('./handshake').handshake,

    /* the two currently used/tested */
    getLast:          require('./documented').getLast,
    getVideoId:       require('./documented').getVideoId,
    getRelated:       require('./documented').getRelated
};

module.exports = {
    implementations: apiListVersion1
};
