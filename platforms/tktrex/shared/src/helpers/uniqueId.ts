import * as encodeUtils from '@shared/utils/encode.utils';
import * as foodUtils from '@shared/utils/food.utils';
import { Nature } from '../models/Nature';

// const logger = trexLogger.extend('uniqueId');

export interface GetTimelineIdOpts {
  publicKey: string;
  version: string;
  feedId: string;
}

export interface TimelineId {
  hash: string;
  word: string;
  id: string;
}

/**
 * Get Timeline Id
 *
 * the timelineId identify the session, it comes from the
 * `feedId` because it need to trust client side.
 **/
export const getTimelineId = ({
  publicKey,
  version,
  feedId,
}: GetTimelineIdOpts): TimelineId => {
  const timelineHash = encodeUtils.hash({
    session: feedId,
    serverPRGN: publicKey,
    version,
  });

  const timelineWord = foodUtils.pickFoodWord(timelineHash);

  return {
    word: timelineWord,
    hash: timelineHash,
    id: `${timelineWord}-${timelineHash.substring(0, 10)}`,
  };
};

export interface GetUniqueIdOpts extends TimelineId {
  href: string;
  nature: Nature;
  videoCounter: number;
  feedCounter: number;
  incremental: number;
}

/**
 * Get HTML (contribution) id
 *
 * the `id` is computed by hashing specific fields. the `id` is not
 * meant to be unique, but instead, every evidence should have a different
 * ID. if a data is sent twice, we should see the duplication because the
 * ID generated is the same, and this prevents duplication
 *
 * */

export const getHTMLId = encodeUtils.GetEncodeUtils(
  ({
    href,
    id: timelineId,
    nature,
    videoCounter,
    feedCounter,
    incremental,
  }: GetUniqueIdOpts) => ({
    href,
    /* based on the 'body.type' we might have fields that are updated
     * (like search, profile, where the user can scroll and report larger evidences)
     * or video block in 'following' or 'foryou', with a fixed url */
    nature,
    /* the timeline guarantee uniqueness by user, version, feedId */
    timelineId,
    /* the counters guarantee an increment at each evidence sent by extension */
    counters: `v(${videoCounter})f(${feedCounter})i(${incremental})`,
  })
);

export const getMetadataId = encodeUtils.GetEncodeUtils(
  (m: { htmlId: string; clientTime: string }) => ({
    id: m.htmlId,
    clientTime: m.clientTime,
  })
);
