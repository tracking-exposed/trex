import _ from 'lodash';
import D from 'debug';

const debug = D('parser:likes');

function forceInteger(stri: string): number {
  const digits = _.filter(stri, function (c) {
    return _.isInteger(_.parseInt(c));
  }).join('');
  if (stri.length !== digits.length) {
    debug(
      'forceInteger convert %s in %s and then %d',
      stri,
      digits,
      _.parseInt(digits)
    );
  }
  return _.parseInt(digits);
}

export interface Likes {
  likes: string | null;
  dislikes: string | null;
  watchedLikes: number | null;
  watchedDislikes: number | null;
}

export function parseLikes(likeInfo: Likes): Likes {
  if (!likeInfo)
    return {
      likes: null,
      dislikes: null,
      watchedLikes: null,
      watchedDislikes: null,
    };
  return {
    ...likeInfo,
    watchedLikes: likeInfo.likes ? forceInteger(likeInfo.likes) : null,
    watchedDislikes: likeInfo.dislikes ? forceInteger(likeInfo.dislikes) : null,
  };
}
