
var apiListVersion1 = {
    /* POST from the userscript */
    processEvents:    require('./events').processEvents,

    /* not API, serving static pages from sections/*.pug */
    getPage:          require('./staticpages').getPage,

    /* for revision */
    unitById:         require('./htmlunit').unitById,


    /* retuern sequence of video for divergency check 
    getSequence:      require('./divergency').getSequence,
    createSequence:   require('./divergency').createSequence,
    getResults:       require('./divergency').getResults,

    handshake:        require('./handshake').handshake,
     * */

    /* the three currently used/tested for the public */
    getLast:          require('./documented').getLast,
    getVideoId:       require('./documented').getVideoId,
    getRelated:       require('./documented').getRelated,

    // TODO, getAuthor
    getPersonalCSV:   require('./personal').getPersonalCSV,

    /* return user' last videos */
    getPersonal:       require('./personal').getPersonal
};

module.exports = {
    implementations: apiListVersion1
};
