/* eslint-disable no-console */

import { parseHTML } from 'linkedom';
import { parseCurlResponse, responseStatus } from './util';

interface ForYouVideo {
  type: 'ForYouVideo';
  videoId: string;
  author: {
    name: string;
    username: string;
  };
  description: string;
  hashtags: string[];
  music: {
    name: string;
    url: string;
  };
  metrics: {
    liken: number;
    sharen: number;
    commentn: number;
  };
  countryCode?: string;
}

export type CurlStatus =
'country not found' |
'unavailable for legal reasons' |
'proxy error' |
'network error' |
'redirect to login'|
'success';

const isDictionary = (obj: unknown): obj is Record<string, unknown> =>
  typeof obj === 'object' && obj !== null && !Array.isArray(obj);

const sanitizeURL = (url: string): string => {
  const uSpace = url.replace(/[()&#.]/g, ' ');
  return uSpace.replace(/\s+/g, '-');
};

interface TikTokParser {
  parseForYouFeed: (html: string) => ForYouVideo[];
  parseCurlStatus: (html: string) => CurlStatus;
}

export const createParser = (): TikTokParser => {
  const parseForYouFeed = (html: string): ForYouVideo[] => {
    const window = parseHTML(html);
    const dataScriptElt = window.document.querySelector('#sigi-persisted-data');

    if (!dataScriptElt) {
      console.log('script element containing data for feed not found');
      return [];
    }

    const script = dataScriptElt.innerHTML.trim();
    // eslint-disable-next-line quotes
    if (!script.startsWith("window['SIGI_STATE']")) {
      console.error('unexpected script element content');
      return [];
    }

    try {
      // eslint-disable-next-line no-eval
      eval(script);
    } catch (err) {
      console.log('failed to evaluate SIGI script');
      return [];
    }

    const data = (window as any).SIGI_STATE;

    if (!data) {
      console.log('data not found in SIGI script element');
      return [];
    }

    const forYouData = data.ItemModule;
    if (!forYouData) {
      console.log('data.ItemModule not found in SIGI script element');
      return [];
    }

    const results: ForYouVideo[] = [];

    if (!isDictionary(forYouData)) {
      console.log('data.ItemModule is not a dictionary');
      return [];
    }

    for (const [videoId, post] of Object.entries(forYouData)) {
      if (!isDictionary(post)) {
        console.log('post is not a dictionary');
        continue;
      }

      const description = (post.desc as string) ?? '';
      const hashtags: string[] = [...description.matchAll(/#(\w+)/g)].map(
        (m) => m[1],
      );

      if (!isDictionary(post.music)) {
        console.log('post.music is not a dictionary');
        continue;
      }

      if (!isDictionary(post.stats)) {
        console.log('post.stats is not a dictionary');
        continue;
      }

      const musicURL = `/music/${sanitizeURL(post.music.title as string)}-${
        post.music.id
      }`.replace(/-+/g, '-');

      const forYouEntry: ForYouVideo = {
        type: 'ForYouVideo',
        videoId,
        author: {
          name: (post.nickname as string) ?? '',
          username: (post.author as string) ?? '',
        },
        description,
        hashtags,
        music: {
          name: `${post.music.title} - ${post.music.authorName}`,
          url: musicURL,
        },
        metrics: {
          liken: post.stats.diggCount as number,
          sharen: post.stats.shareCount as number,
          commentn: post.stats.commentCount as number,
        },
      };

      results.push(forYouEntry);
    }

    return results;
  };

  const parseCurlStatus = (html: string): CurlStatus => {
    const maybeChunks = parseCurlResponse(html);
    if (maybeChunks instanceof Error) {
      throw maybeChunks;
    }
    return responseStatus(maybeChunks);
  };

  return {
    parseCurlStatus,
    parseForYouFeed,
  };
};

export default createParser;
