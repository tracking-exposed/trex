
var apiListVersion1 = {
    /* POST from the userscript */
    processEvents:    require('./events').processEvents,

    /* not API, serving static pages from sections/*.pug */
    getPage:          require('./staticpages').getPage,

    /* alarms */
    getAlarms:        require('./alarms').getAlarms,

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
};

module.exports = {
    implementations: apiListVersion1
};
