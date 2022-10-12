import * as utils from '@shared/utils/food.utils';
import {
  NativeMetadata,
  ProfileMetadata,
  SearchMetadata,
  TKMetadata,
} from '@tktrex/shared/models/metadata';
import { Nature } from '@tktrex/shared/models/Nature';
import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import { formatDistance, parseISO } from 'date-fns';
import _ from 'lodash';
import D from 'debug';
import moment from 'moment';

const debug = D('lib:CSV');

function produceCSVv1(entries: any[]) {
  const keys = _.keys(entries[0]);

  const produced = _.reduce(
    entries,
    function (memo: any, entry: any, cnt: number) {
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
        // eslint-disable-next-line no-console
        console.log(memo.csv);
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(entry, undefined, 2));
        throw new Error('Format error');
      }

      _.each(keys, function (k: string, i: number) {
        let swap = _.get(entry, k, '');
        if (k === 'savingTime') memo.csv += moment(swap).toISOString();
        else if (_.isInteger(swap)) memo.csv += swap;
        else if (k === 'related') {
          debug('Ignored related content'); // is this a skeleton?
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

// function invoked to depack and flatten metadata {type: search}
// to produce CSV.
interface FlattenSearch {
  query: string;
  videoId: string;
  textdesc: string;
  thumbfile: string;
  metadataId: string;
  timeago: string;
  tags: string;
}

export function flattenSearch(m: SearchMetadata, shared: any): FlattenSearch[] {
  return (m.results || []).reduce<FlattenSearch[]>((acc, result, order) => {
    const thumbfile =
      m.thumbnails && m.thumbnails.length
        ? m.thumbnails[order]?.filename
        : null;

    const readyo: FlattenSearch = {
      ...result.video,
      videoId: '' + result.video.videoId,
      publishingDate: result.publishingDate,
      order: result.order,
      tags: _.compact(
        _.map(result.linked, function (link) {
          return link?.link?.type === 'tag' ? link.desc : null;
        })
      ).join(', '),
      metadataId: m.id.substring(0, 10),
      savingTime: moment(m.savingTime).format('YYYY-MM-DD HH:mm'),
      timeago: formatDistance(parseISO(m.savingTime), new Date()),
      query: m.query,
      textdesc: result.textdesc,
      thumbfile: thumbfile ? thumbfile.replace(/(.*\/)|(.*\\)/, '') : null,
      ...shared,
    };
    acc.push(readyo);
    return acc;
  }, []);
}

interface FlattenProfile {
  profileName: string;
  views?: string;
  videoId: string;
  title?: string;
  order: number;
  metadataId: string;
  savingTime: string;
  href: string;
}

export function flattenProfile(
  metaprofile: ProfileMetadata,
  memo: any
): FlattenProfile[] {
  // function invoked to depack and flatten metadata {type: search}
  // to produce CSV.

  _.each(metaprofile.results || [], function (result, order) {
    /* TODO 
    const thumbfile =
      metaprofile.thumbnails && metaprofile.thumbnails.length
        ? metaprofile.thumbnails[order]?.filename
        : null; */
    const readyo: FlattenProfile = {
      ...result.video,
      profileName: metaprofile.creatorName,
      views: result.views,
      title: result.title,
      order: order + 1,
      metadataId: metaprofile.id,
      savingTime: moment(metaprofile.savingTime).format('YYYY-MM-DD HH:mm'),
      href:
        'https://www.tiktok.com/@' +
        metaprofile.creatorName +
        '/video/' +
        result.video.videoId,
      /* thumbfile: thumbfile ? thumbfile.replace(/(.*\/)|(.*\\)/, '') : null, */
    };
    _.unset(readyo, 'authorId');
    readyo.videoId = ' ' + readyo.videoId;
    // @ts-ignore
    memo.push(readyo);
  });
  return memo;
}

interface FlattenNative {
  music_url?: string;
  music_title?: string;
  hashtags?: string;
}

export function flattenNative(
  {
    _id,
    id,
    nature: { videoId, authorId },
    music,
    author,
    metrics,
    hashtags,
    publicKey,
    ...datum
  }: NativeMetadata,
  shared: any
): FlattenNative[] {
  return [
    {
      ...shared,
      authorId,
      videoId,
      music_url: music?.url,
      music_title: music?.name,
      ...metrics,
      hashtags: hashtags?.join(' '),
    },
  ];
}

function pickFeedFields(metae: any): any {
  return {
    authorName: metae.author?.name,
    authorUser: metae.author?.username,
    savingTime: metae.savingTime,
    order: metae.order,
    refreshId: metae.timelineId,
    description: metae.description,
    tags: metae.hashtags?.join(', ') || '',
    ...metae.metrics,
    musicURL: metae?.music?.url || null,
    musicTitle: metae?.music?.name || null,
    hasStitch: !!_.get(metae, 'stitch', false),
    publicKey: metae.publicKey,
    id: metae.id,
  };
}

/**
 * */
function unrollNested(
  metadata: TKMetadata[],
  options: { type: Nature['type']; private?: boolean; experiment?: boolean }
) {
  return pipe(
    metadata,
    A.map((m): O.Option<any[]> => {
      // debug(`Metadata %O`, m);
      // this set of filtering guarantee only the specific 'kind' is processed
      if (m.type !== options.type) return O.none;

      const shared: any = {
        pseudo: utils.string2Food(m.publicKey),
        metadataId: m.id.substring(0, 8),
        savingTime: m.savingTime,
      };

      if (options.private) {
        const smp = shared.pseudo.split('-');
        shared.pseudo = smp[0] + '-' + smp[1];
      }

      if (options.experiment) {
        shared.experimentId = m.experimentId;
        shared.researchTag = m.researchTag;
        // note, this is only present in experiment as sharedDataPull
        // in routes/experiment perform an aggregate, but we
        // should consider do the same in personal and elsewhere
        // and add move this into "shared" initialization above,
        // to test it: pick an experiment CSV and then a personal CSV.
        shared.href = m.href;
      }

      /* entry is a list, this piece of code is diving into
       * the linked list inside the elements, and based on the
       * sub-entry the result is offered back. advertising
       * might be eterogeneous type */
      if (options.type === 'search' && m.type === 'search')
        return O.some(flattenSearch(m, { ...shared }));
      if (options.type === 'native' && m.type === 'native')
        return O.some(flattenNative(m, shared));
      if (
        (options.type === 'creator' || options.type === 'profile') &&
        (m.type === 'creator' || m.type === 'profile')
      )
        return O.some(flattenProfile(m, []));

      return O.some(pickFeedFields(m));
    }),
    A.compact,
    A.flatten
  );
}

const allowedTypes = ['search', 'foryou', 'native'];

export default { allowedTypes, unrollNested, produceCSVv1 };
