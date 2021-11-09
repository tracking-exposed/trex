const _ = require('lodash');
const debug = require('debug')('lib:CSV');
const moment = require('moment');

const utils = require('./utils');

function produceCSVv1(entries, requestedKeys) {

    const keys = requestedKeys || _.keys(entries[0]);

    const produced = _.reduce(entries, function(memo, entry, cnt) {
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
            if(_.endsWith(k,'Time') || k == 'lastUpdate')
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
    const numerizedLikes = utils.parseLikes(evidence.likeInfo); // converts '1233 me gusta'
    // TODO ^^^^^^^^^^^^^^ should be removed in the future because it will be part of 'evidence.related' 
    const recommendedCounterCheck = _.size(evidence.related);
    _.each(evidence.related, function(related, evidenceCounter) {
        const entry = {
            /* this is removed or anonymized by the called */
            publicKey: evidence.publicKey,

            login: evidence.login,
            id: evidence.id.replace(/[0-7]/g, ''),
            savingTime: evidence.savingTime,
            clientTime: evidence.clientTime,

            uxLang: evidence.blang,

            parameter: related.parameter,
            recommendedId: utils.hash({ motherId: evidence.id, p: evidence.publicKey, evidenceCounter}),
            recommendedVideoId: related.videoId.replace(/\&.*/, ''),
            recommendedAuthor: related.recommendedSource,
            recommendedTitle: related.recommendedTitle, 
            recommendedLength: related.recommendedLength,
            // recommendedDisplayL: related.recommendedDisplayL,
            recommendedLengthText: related.recommendedLengthText,
            recommendedPubTime: related.publicationTime,
            // ptPrecision: related.timePrecision, // doens't really matter ATM
            recommendedRelativeS: related.recommendedRelativeSeconds, // distance between clientTime and publicationTime
            recommendedViews: related.recommendedViews,
            recommendedForYou: related.foryou,
            recommendedVerified: related.verified,
            recommendationOrder: related.index,
            recommendedKind: related.isLive ? "live" : "video", // this should support also 'playlist' 

            watchedVideoId: evidence.videoId,
            watchedTitle: evidence.title,
            watchedAuthor: evidence.authorName,
            watchedChannel: evidence.authorSource,
            watchedPubTime: evidence.publicationTime,
            watchedViews: evidence.viewInfo.viewStr ? evidence.viewInfo.viewNumber : null,
            watchedLike: numerizedLikes.watchedLikes,
            watchedDislike: numerizedLikes.watchedDislikes,
        };
        /* optional fields, only existing in wetest1 -- todo manage these as a list */
        if(evidence.sessionId)
            entry.sessionId = evidence.sessionId;
        if(_.isInteger(evidence.hoursOffset))
            entry.hoursOffset = evidence.hoursOffset;
        if(!_.isUndefined(evidence.top20))
            entry.top20 = evidence.top20;
        if(evidence.qualitative)
            entry.qualitative = evidence.qualitative;
        memo.push(entry);
    });
    if(recommendedCounterCheck && (recommendedCounterCheck != _.last(memo).recommendationOrder))
        debug("Missing element? %d != %d evidence.id %s",
            _.last(memo).recommendationOrder, recommendedCounterCheck, evidence.id);
    return memo;
}

function unwindSections(memo, evidence) { // metadata.type = 'home' with 'selected'
    const selectionCounterCheck = _.size(evidence.related);
    if(evidence.selected[0] && !(evidence.selected[0].videoId) ) {
        debug("Excluding id %s because seems the videoId have a problm", evidence.selected[0].id);
	return memo;
    }
    _.each(evidence.selected, function(selected, evidenceCounter) {
        const entry = {
            /* this is removed or anonymized by the called */
            publicKey: evidence.publicKey,

            login: evidence.login,
            id: evidence.id.replace(/[0-7]/g, ''),
            savingTime: evidence.savingTime,
            clientTime: evidence.clientTime,
            order: selected.index,

            uxLang: evidence.blang,
           
            parameter: selected.parameter,
            sectionName: selected.sectionName,
            selectedId: utils.hash({ motherId: evidence.id, p: evidence.publicKey, evidenceCounter}),
            selectedVideoId: selected.videoId ? selected.videoId.replace(/\&.*/, '') : null,
            selectedAuthor: selected.recommendedSource,
            selectedChannel: selected.recommendedHref,
            selectedTitle: selected.recommendedTitle,
            selectedLength: selected.recommendedLength,
            // selectedDisplayL: selected.selectedDisplayL,
            selectedLengthText: selected.recommendedLengthText,
            selectedPubTime: selected.publicationTime,
            // ptPrecision: selected.timePrecision, doesn't really matter ATM because they are all 'estimated'
            selectedRelativeS: selected.recommendedRelativeSeconds,
            selectedViews: selected.recommendedViews,
            selectedKind: selected.isLive ? "live": "video", // this should support also 'playlist' 
        };
        /* optional fields */
        if(_.isInteger(evidence.hoursOffset))
            entry.hoursOffset = evidence.hoursOffset;
        memo.push(entry);
    });
    if(selectionCounterCheck && (selectionCounterCheck != _.last(memo).order))
        debug("Missing element? %d != %d evidence.id %s",
            _.last(memo).order, selectionCounterCheck, evidence.id);
    return memo;
};

module.exports = {
    produceCSVv1,
    unrollRecommended,
    unwindSections,
};
