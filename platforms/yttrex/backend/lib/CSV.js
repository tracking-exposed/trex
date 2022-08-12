const _ = require('lodash');
const debug = require('debug')('lib:CSV');
const moment = require('moment');

const utils = require('./utils');

function produceCSVv1(entries, requestedKeys) {
  const keys = requestedKeys || _.keys(entries[0]);

  const produced = _.reduce(
    entries,
    function (memo, entry, cnt) {
      if (!memo.init) {
        memo.expect = _.size(keys);
        memo.csv = _.trim(JSON.stringify(keys), '][') + '\n';
        memo.init = true;
      }

      if (_.size(keys) !== memo.expect) {
        debug(
          'Invalid JSON input: expected %d keys, got %d',
          memo.expect,
          _.size(keys)
        );
        throw new Error('CSV fatal issue (JSON input key error)');
      }

      _.each(keys, function (k, i) {
        let swap = _.get(entry, k, '');
        if (_.endsWith(k, 'Time') || k === 'lastUpdate')
          memo.csv += moment(swap).toISOString();
        else if (_.isInteger(swap)) {
          memo.csv += swap;
        } else {
          swap = _.replace(swap, /"/g, '〃');
          swap = _.replace(swap, /'/g, '’');
          memo.csv += '"' + swap + '"';
        }
        if (!_.eq(i, _.size(keys) - 1)) memo.csv += ',';
      });
      memo.csv += '\n';
      return memo;
    },
    { init: false, csv: '', expect: 0 }
  );
  return produced.csv;
}

function flattenSearches(evidence, shared) {
  // SEARCH
  const fields = [
    'position',
    'title',
    'authorName',
    'authorSource',
    'sectionName',
    'href',
    'originalHref',
    'videoId',
    'views',
    'isLive',
    'published',
    'secondsAgo',
  ];

  return _.map(evidence.results, function (found, i) {
    const keep = _.pick(found, fields);

    return {
      ...shared,
      id: shared.metadataId + 'S' + i + found.position,
      ...keep,
      query: evidence.query,
    };
  });
}

function unrollRecommended(evidence, shared) {
  // VIDEO
  const fields = [
    'index',
    'verified',
    'videoId',
    'originalHref',
    'recommendedSource',
    'recommendedTitle',
    'recommendedLength',
    'recommendedRelativeSeconds',
    'recommendedViews',
    'isLive',
    'publicationTime',
  ];

  return _.map(evidence.related, function (related, i) {
    const keep = _.pick(related, fields);

    return {
      ...shared,
      id: shared.metadataId + 'V' + i + related.index,
      ...keep,
      watchedVideoId: evidence.videoId,
      watchedTitle: evidence.title,
      watchedAuthor: evidence.authorName,
      watchedChannel: evidence.authorSource,
      watchedPubTime: evidence.publicationTime,
      forKids: evidence.forKids,
    };
  });
}

function reconnectAdvertising(evidence, shared) {
  return {
    ..._.omit(shared, ['nature']),
    ...shared.nature,
    selectorName: evidence.selectorName,
    sponsoredSite: evidence.sponsoredSite,
    sponsoredName: evidence.sponsoredName,
  };
}

function unwindSections(evidence, shared) {
  // HOME
  const fields = [
    'index',
    'verified',
    'originalHref',
    'videoId',
    'recommendedSource',
    'recommendedHref',
    'recommendedTitle',
    'recommendedLength',
    'recommendedRelativeSeconds',
    'recommendedViews',
    'isLive',
    'publicationTime',
  ];

  return _.map(evidence.selected, function (selected, i) {
    const keep = _.pick(selected, fields);

    return {
      ...shared,
      id: shared.metadataId + 'H' + i + selected.index,
      ...keep,
    };
  });
}

/*
  - let here to remind self about chardet.

    return _.map(results, function(r) {
        const chardetoutp = chardet.analyse(Buffer.from(r.related.recommendedTitle));
        return {
            watcher: utils.string2Food(r.publicKey),
            recommendedTitleCharset: chardetoutp[0].name,
            recommendedTitleLang: chardetoutp[0].lang || "unknown",
*/

function unrollNested(metadata, options) {
  /*  | options can be:               |
        | type (home|video|search|adv)  |
        | private (true|undefined)      |
        | experiment (true|undefined)   | */

  return _.flatten(
    _.compact(
      _.map(metadata, function (evidence) {
        // this set of filtering guarantee only the specific 'kind' is processed
        if (evidence.type !== options.type) return null;

        const shared = {
          pseudo: utils.string2Food(evidence.publicKey),
          metadataId: evidence.id.substr(0, 8),
          savingTime: evidence.savingTime,
          clientTime: evidence.clientTime,
          login: evidence.login,
          uxLang: evidence.blang,
        };

        if (options.private) {
          const smp = shared.pseudo.split('-');
          shared.pseudo = smp[0] + '-' + smp[1];
        }
        if (options.experiment) {
          shared.experimentId = evidence.experiment.experimentId;
          shared.researchTag = evidence.experiment.researchTag;
          shared.execount = evidence.experiment.execount;
          // note, this is only present in experiment as sharedDataPull
          // in routes/experiment perform an aggregate, but we
          // should consider do the same in personal and elsewhere
          // and add move this into "shared" initialization above,
          // to test it: pick an experiment CSV and then a personal CSV.
          shared.originalHref = evidence.originalHref;
        }

        let entry = null;
        /* entry is a list, this piece of code is diving into
         * the linked list inside the elements, and based on the
         * sub-entry the result is offered back. advertising
         * might be eterogeneous type */
        if (options.type === 'home') entry = unwindSections(evidence, shared);
        else if (options.type === 'video')
          entry = unrollRecommended(evidence, shared);
        else if (options.type === 'search')
          entry = flattenSearches(evidence, shared);
        else if (options.type === 'adv')
          entry = reconnectAdvertising(evidence, shared);

        return entry;
      })
    )
  );
}

const allowedTypes = ['video', 'search', 'home', 'adv'];

module.exports = {
  allowedTypes,
  // this is the function to call to convert raw metadata
  unrollNested,
  // this is the one that converts JSON to CSV
  produceCSVv1,
};
