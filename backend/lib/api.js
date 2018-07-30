
var apiListVersion1 = {
    /* POST from the userscript */
    processEvents:    require('./events').processEvents,

    /* POST on parser operations */
    snippetAvailable: require('./parser').snippetAvailable,
    snippetContent:   require('./parser').snippetContent,
    snippetResult:    require('./parser').snippetResult,

    /* not API, serving static pages from sections/*.pug */
    getPage:          require('./staticpages').getPage,

    /* alarms */
    getAlarms:        require('./alarms').getAlarms,

    /* selector fetch experiment */
    userInfo:         require('./selector').userInfo,

};

module.exports = {
    implementations: apiListVersion1
};
