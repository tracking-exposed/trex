const _ = require('lodash');
const debug = require('debug')('lib:CSV');
const moment = require('moment');

const utils = require('./utils');

function produceCSVv1(entries) {

    const keys = _.keys(entries[0]);

    let produced = _.reduce(entries, function(memo, entry, cnt) {
        if(!memo.init) {
            memo.expect = _.size(keys);
            memo.csv = _.trim(JSON.stringify(keys), '][') + "\n";
            memo.init = true;
        }

        if(_.size(keys) != memo.expect) {
            debug("Invalid JSON input: expected %d keys, got %d",
                memo.expect, _.size(keys));
            console.log(memo.csv);
            console.log(JSON.stringify(entry, undefined, 2));
            throw new Error("Format error");
        }

        _.each(keys, function(k, i) {
            let swap = _.get(entry, k, "");
            if(_.endsWith(k,'Time'))
                memo.csv += moment(swap).toISOString();
            else if(_.isInteger(swap)) {
                memo.csv += swap;
            }
            else {
                swap = _.replace(swap, /"/g, '〃');
                swap = _.replace(swap, /'/g, '’');
                memo.csv +=  '"' + swap + '"';
            }
            if(!_.eq(i, _.size(keys) - 1))
                memo.csv += ',';
        });
        memo.csv += "\n";
        return memo;

    }, { init: false, csv: "", expect: 0 });
    return produced.csv;
};


function unrollRecommended(memo, evidence) { // metadata.type = video with 'related' 
    _.each(evidence.related, function(related, evidenceCounter) {
        let entry = {
            /* this is removed or anonymized by the called */
            publicKey: evidence.publicKey,

            evidence: evidenceCounter,
            login: evidence.login,
            id: evidence.id.replace(/[0-7]/g, ''),
            savingTime: evidence.savingTime,
            clientTime: evidence.clientTime,

            uxLang: evidence.blang,

            parameter: related.parameter,
            recommendedId: utils.hash({ motherId: evidence.id, p: evidence.publicKey, evidenceCounter}),
            recommendedVideoId: related.videoId,
            recommendedAuthor: related.recommendedSource,
            recommendedTitle: related.recommendedTitle, 
            recommendedLength: related.recommendedLength,
            recommendedDisplayL: related.recommendedDisplayL,
            recommendedLengthText: related.recommendedLengthText,
            recommendedPubTime: related.publicationTime,
            ptPrecision: related.timePrecision,
            recommendedRelativeS: related.recommendedRelativeSeconds, // distance between clientTime and publicationTime
            recommendedViews: related.recommendedViews,
            recommendedForYou: related.foryou,
            recommendedVerified: related.verified,
            recommendationOrder: related.index,
            recommendedKind: evidence.isLive ? "live" : "video", // this should support also 'playlist' 

            watchedVideoId: evidence.videoId,
            watchedAuthor: evidence.authorName,
            watchedPubTime: evidence.publicationTime,
            watchedTitle: evidence.title,
            watchedViews: evidence.viewInfo.viewStr ? evidence.viewInfo.viewStr : null,
            watchedChannel: evidence.authorSource,
        };
        memo.push(entry);
    })
    return memo;
}

function unwindSections(memo, evidence) { // metadata.type = 'home' with 'selected'
    _.each(evidence.selected, function(selected, evidenceCounter) {
        let entry = {
            /* this is removed or anonymized by the called */
            publicKey: evidence.publicKey,

            evidence: evidenceCounter,
            login: evidence.login,
            id: evidence.id.replace(/[0-7]/g, ''),
            savingTime: evidence.savingTime,
            clientTime: evidence.clientTime,
            order: selected.index,

            uxLang: evidence.uxlang,
           
            parameter: selected.parameter,
            sectionName: selected.sectionName,
            selectedId: utils.hash({ motherId: evidence.id, p: evidence.publicKey, evidenceCounter}),
            selectedVideoId: selected.videoId,
            selectedAuthor: selected.recommendedSource,
            selectedChannel: selected.recommendedHref,
            selectedTitle: selected.recommendedTitle,
            selectedLength: selected.recommendedLength,
            selectedDisplayL: selected.selectedDisplayL,
            selectedLengthText: selected.recommendedLengthText,
            selectedPubTime: selected.publicationTime,
            ptPrecision: selected.timePrecision,
            selectedRelativeS: selected.recommendedRelativeSeconds,
            selectedViews: selected.recommendedViews,
            selectedKind: selected.isLive ? "live": "video", // this should support also 'playlist' 
        };
        memo.push(entry);
    });
    return memo;
};

module.exports = {
    produceCSVv1,
    unrollRecommended,
    unwindSections,
};