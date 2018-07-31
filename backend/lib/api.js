
var apiListVersion1 = {
    /* POST from the userscript */
    processEvents:    require('./events').processEvents,

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
