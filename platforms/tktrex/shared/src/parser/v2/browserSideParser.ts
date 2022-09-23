import { pipe } from 'fp-ts/lib/function';

import { chain, map } from 'fp-ts/lib/Either';

import { normalizeString } from './lib/util';

import { TikTokParserBrowserInterface } from './TikTokParserInterface';

import {
  combineParsers,
  findAllElts,
  findElt,
  liftParser,
  parseAlways,
  parseEltText,
  parseEltAttrText,
  mapValue,
} from './parserUtil';

const description = parseEltText('[data-e2e="video-desc"]');

const baretext = liftParser((node) =>
  pipe(
    node,
    findElt('[data-e2e="video-desc"]'),
    chain(findAllElts('span')),
    map((elts) =>
      elts
        .map((elt) => normalizeString(elt.textContent))
        .filter(Boolean)
        .join(' '),
    ),
  ),
);

const hashtags = liftParser((node) =>
  pipe(
    node,
    findElt('[data-e2e="video-desc"]'),
    chain(findAllElts('strong')),
    map((elts) =>
      elts
        .map((elt) => normalizeString(elt.textContent))
        .filter(Boolean)
        .filter((str) => str.startsWith('#')),
    ),
  ),
);

const metrics = combineParsers({
  liken: parseEltText('[data-e2e="like-count"]'),
  sharen: parseEltText('[data-e2e="share-count"]'),
  commentn: parseEltText('[data-e2e="comment-count"]'),
});

const name = parseEltText('[data-e2e="video-author-nickname"]');
const username = parseEltText('[data-e2e="video-author-uniqueid"]');

const baseAuthor = {
  username,
  link: mapValue((parsedName) => `/@${parsedName}`)(username),
};

const authorWithoutName = combineParsers(baseAuthor);
const author = combineParsers({
  ...baseAuthor,
  name,
});

const music = combineParsers({
  name: parseEltText('[data-e2e="video-music"]'),
  url: parseEltAttrText('[data-e2e="video-music"] a', 'href'),
});

export const createParser = (): TikTokParserBrowserInterface => {
  const commonParsers = {
    baretext,
    description,
    hashtags,
    metrics,
    music,
  };

  const parseForYouVideo = combineParsers({
    ...commonParsers,
    type: parseAlways('foryou'),
    author,
  });

  const parseSearchVideo = combineParsers({
    ...commonParsers,
    type: parseAlways('search'),
    author: authorWithoutName,
  });

  return {
    parseForYouVideo,
    parseSearchVideo,
  };
};

export default createParser;
