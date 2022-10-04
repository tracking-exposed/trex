import { ParserFn } from '@shared/providers/parser.provider';
import { HTMLSource } from '../source';
import { Nature } from '../../models/Nature';
import { YTParserConfig } from '../config';
import processHome from './home';
import { processSearch } from './searches';
import parseVideo from './video';
import { trexLogger } from '@shared/logger';
import * as _ from 'lodash';

const natureLogger = trexLogger.extend('parser:nature');

export function getNatureFromURL(href: string): Nature | null {
  // this function MUST support the different URLs
  // format specify in ../../extension/src/consideredURLs.js
  const uq = new URL(href);
  if (uq.pathname === '/results') {
    const searchTerms = uq.searchParams.get('search_query');
    return {
      type: 'search',
      query: searchTerms as any,
    };
  } else if (uq.pathname === '/watch') {
    const videoId = uq.searchParams.get('v') as any;
    return {
      type: 'video',
      videoId,
    };
  } else if (uq.pathname === '/') {
    return {
      type: 'home',
    };
  } else if (_.startsWith(uq.pathname, '/hashtag')) {
    const hashtag = uq.pathname.split('/').pop() as any;
    return {
      type: 'hashtag',
      hashtag,
    };
  } else if (
    _.startsWith(uq.pathname, '/channel') ||
    _.startsWith(uq.pathname, '/user') ||
    _.startsWith(uq.pathname, '/c')
  ) {
    const authorSource = uq.pathname.split('/').pop() as any;
    return {
      type: 'channel',
      authorSource,
    };
  } else {
    natureLogger.debug('Unknow condition: %s', uq.href);

    return null;
  }
}

const processNature =
  (type: Nature['type']): ParserFn<HTMLSource, any, YTParserConfig> =>
  (e, findings, ctx) => {
    switch (type) {
      case 'video':
        return parseVideo(e, findings, ctx);
      case 'search':
        return processSearch(e, findings, ctx);
      case 'home':
        return processHome(e, findings, ctx);
      default:
        throw new Error(`Nature ${type} not handled.`);
    }
  };

/**
 * Extract the nature from given entry.
 *
 *
 */
const nature: ParserFn<HTMLSource, Nature, YTParserConfig> = async (
  e,
  findings,
  ctx
) => {
  const anyHTML: any = e.html;
  const type = e.html.nature.type ?? anyHTML.type;
  natureLogger.debug('Type received %s', type);
  const nature = await processNature(type)(e, findings, ctx);
  if (!nature) {
    throw new Error('No nature found for this entry.');
  }

  return {
    type,
    ...nature,
  };
};

export default nature;
