import { Either, left, right } from 'fp-ts/lib/Either';

import { URLError } from '../models/Error';
import { Nature } from '../models/Nature';

export const getNatureByHref = (href: string): Either<URLError, Nature> => {
  const url = new URL(href);
  const chunks = url.pathname.split('/');

  if (url.hostname !== 'www.tiktok.com') {
    return left(new URLError('URL is not from tiktok', url));
  }

  if (
    url.pathname === '/foryou' ||
    url.pathname === '/' ||
    /\/[a-z]{2}$/.test(url.pathname)
  ) {
    return right({ type: 'foryou' });
  } else if (url.pathname === '/following') {
    return right({ type: 'following' });
  } else if (chunks[2] === 'video' && chunks.length >= 3) {
    return right({
      type: 'video',
      authorId: chunks[1],
      videoId: chunks[3],
    });
  } else if (url.pathname.startsWith('/@')) {
    return right({
      type: 'creator',
      creatorName: url.pathname.substring(1),
    });
  } else if (url.pathname.startsWith('/tag')) {
    return right({
      type: 'tag',
      hashtag: chunks[2],
    });
  } else if (url.pathname === '/search') {
    // TODO check if tabs 'video' 'account' fit here;
    // probably we should use _.startsWith or
    // handle three search conditions
    return right({
      type: 'search',
      query: url.searchParams.get('q') ?? '',
      timestamp: url.searchParams.get('t') ?? '',
    });
  }

  return left(new URLError('unexpected condition from URL', url));
};
