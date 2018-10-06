import _ from 'lodash';
const bo = chrome || browser;

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create
// This is the doc about tabs

bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'opener') {
        // this component receive all the information about tab rendering, refresh, time of playing
        var vinfo = request.payload;
        var buildPromise = _.partial(waitOpenCloseTab, vinfo.tabtime);
        var promiseList = _.map(vinfo.list, buildPromise);

        /* the promises is one for every URL */
        Promise.all(promiseList);
    }
});

function waitOpenCloseTab(tabtime, video, i, full) {

    return new Promise(function(success, reject) {
        var start = tabtime * i;
        var end = tabtime -2;

        setTimeout(function() {
            console.log(`Divergency test: starting ${i} ${video.href}`); 
            bo.tabs.create({
                url: video.href,
                active: false, // true
            }, function(tab) {
                setTimeout(function() {
                    console.log(`Divergency test: Closing ${i} ${video.href}`); 
                    bo.tabs.discard(tab.id);
                }, end * 1000);
            });
        }, start * 1000);
    });
};
