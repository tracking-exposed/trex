import { ParserFn } from '@shared/providers/parser.provider';
import { throwEitherError } from '@shared/utils/fp.utils';
import { Nature } from '../../models/Nature';
import { TKParserConfig } from '../config';
import { HTMLSource } from '../source';
import { Either, left, right } from 'fp-ts/lib/Either';

const HOSTNAMES = ['www.tiktok.com', 'tiktok.com'];
export const getNatureByHref = (href: string): Either<Error, Nature> => {
  const url = new URL(href);
  const chunks = url.pathname.split('/');

  if (!HOSTNAMES.includes(url.hostname)) {
    return left(new Error(`URL is not from tiktok: ${url}`));
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
      type: 'native',
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

  return left(new Error(`Unexpected condition from URL:  ${url}`));
};

const nature: ParserFn<HTMLSource, Nature, TKParserConfig> = async(
  envelop,
  previous,
) => {
  /* this parser is meant to analye the URL
   * and understand which kind of nature has this html */
  return throwEitherError(getNatureByHref(envelop.html.href));
};

export default nature;
