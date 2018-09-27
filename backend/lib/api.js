
var apiListVersion1 = {
    /* POST from the userscript */
    processEvents:    require('./events').processEvents,

    /* not API, serving static pages from sections/*.pug */
    getPage:          require('./staticpages').getPage,

    /* alarms */
    getAlarms:        require('./alarms').getAlarms,

    /* selector fetch experiment */
    userInfo:         require('./selector').userInfo,

    /* for revision */
    unitById:         require('./htmlunit').unitById,

    /* return user' last videos info */
    getUserBacklog:   require('./backlog').getUserBacklog,

    /* retuern sequence of video for divergency check */
    getSequence:      require('./divergency').getSequence

};

module.exports = {
    implementations: apiListVersion1
};
