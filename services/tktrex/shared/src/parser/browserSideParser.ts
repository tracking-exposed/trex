import { Either, left, right } from 'fp-ts/lib/Either';

import { normalizeString } from '../lib/util';
import { ForYouVideoMetaData } from '../models/MetaData';
import {
  SearchableNode,
  TikTokParserBrowserInterface,
} from './TikTokParserInterface';
import { ParseError } from '../models/Error';

export const createParser = (): TikTokParserBrowserInterface => {
  const parseForYouVideo = (node: SearchableNode): Either<
    ParseError,
    ForYouVideoMetaData
  > => {
    const type = 'foryou';

    const descriptionElt = node.querySelector(
      '[data-e2e="video-desc"]',
    );

    if (!descriptionElt) {
      return left(
        new ParseError('could not find description')
          .addMissingField('description'),
      );
    }

    const description = normalizeString(descriptionElt.textContent);

    const baretext = [...descriptionElt.querySelectorAll('span')]
      .map((span) => normalizeString(span.textContent))
      .filter(Boolean)
      .join(' ');

    const hashtagsElts = descriptionElt.querySelectorAll(
      'strong',
    );

    const hashtags = [...hashtagsElts].map(
      (node) => normalizeString(node.textContent),
    ).filter(Boolean).filter((str) => str.startsWith('#'));

    const metricsAttrs = ['like-count', 'share-count', 'comment-count'] as readonly string[];
    const metricsMap: { [key: typeof metricsAttrs[number]]: string } = {
      'like-count': 'liken',
      'share-count': 'sharen',
      'comment-count': 'commentn',
    };

    const metrics = {
      liken: '',
      commentn: '',
      sharen: '',
    };

    for (const attr of metricsAttrs) {
      const elt = node.querySelector(`[data-e2e="${attr}"]`);
      if (!elt) {
        return left(
          new ParseError(`could not find ${attr}`)
            .addMissingField(attr),
        );
      }

      const txt = elt.textContent;
      if (!txt) {
        return left(
          new ParseError(`could not find ${attr}`)
            .addMissingField(attr),
        );
      }

      const targetAttr = metricsMap[attr];
      (metrics as unknown as any)[targetAttr] = txt;
    }

    const authorIdElt = node.querySelector(
      '[data-e2e="video-author-uniqueid"]',
    );

    if (!authorIdElt) {
      return left(
        new ParseError('could not find author id')
          .addMissingField('author id'),
      );
    }

    const username = normalizeString(authorIdElt.textContent);

    const nameElt = node.querySelector(
      '[data-e2e="video-author-nickname"]',
    );

    if (!nameElt) {
      return left(
        new ParseError('could not find name')
          .addMissingField('name'),
      );
    }

    const name = normalizeString(nameElt.textContent);

    const author = {
      link: `/@${username}`,
      username,
      name,
    };

    const musicElt = node.querySelector(
      '[data-e2e="video-music"]',
    );

    if (!musicElt) {
      return left(
        new ParseError('could not find music')
          .addMissingField('music'),
      );
    }

    const musicName = normalizeString(musicElt.textContent);

    const musicURLElt = musicElt.querySelector('a');

    if (!musicURLElt) {
      return left(
        new ParseError('could not find music url')
          .addMissingField('music url'),
      );
    }

    const musicURL = normalizeString(musicURLElt.href);

    const music = {
      url: musicURL,
      name: musicName,
    };

    return right({
      type,
      author,
      baretext,
      description,
      hashtags,
      metrics,
      music,
    });
    // return left(new ParseError('parseForYouVideo not implemented'));
  };

  return {
    parseForYouVideo,
  };
};

export default createParser;
