import { URLError } from '../models/Error';
import { Nature } from '../models/Nature';

export const getNatureByHref = (href: string): Nature => {
  const url = new URL(href);
  const chunks = url.pathname.split('/');

  if (url.hostname !== 'www.tiktok.com') {
    throw new URLError('URL is not from tiktok', url);
  }

  if (
    url.pathname === '/foryou' ||
    url.pathname === '/' ||
    /\/[a-z]{2}$/.test(url.pathname)
  ) {
    return { type: 'foryou' };
  } else if (url.pathname === '/following') {
    return { type: 'following' };
  } else if (chunks[2] === 'video' && chunks.length >= 3) {
    return {
      type: 'video',
      authorId: chunks[1],
      videoId: chunks[3],
    };
  } else if (url.pathname.startsWith('/@')) {
    return {
      type: 'creator',
      creatorName: url.pathname.substring(1),
    };
  } else if (url.pathname === '/search') {
    return {
      type: 'search',
      query: url.searchParams.get('q') ?? '',
      timestamp: url.searchParams.get('t') ?? '',
    };
  }

  throw new URLError('unexpected condition from URL', url);
};
