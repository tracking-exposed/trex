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

// The promises created here, sleep, create and then discard the tab
// The are created in parallel because something might cause background page to be refresh and the chain be lost
// They are not .remove but .discard because that was causing the chain to be interrupted
//
// Basically are all shitty hacks in order to make the tab open, play for a few seconds, and then open the next
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
