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

    const baretextElt = descriptionElt.querySelector(
      'span:first-child',
    );

    if (!baretextElt) {
      return left(
        new ParseError('could not find baretext')
          .addMissingField('baretext'),
      );
    }

    const baretext = normalizeString(baretextElt.textContent);

    const hashtags = [] as string[];

    const metrics = {
      liken: '',
      commentn: '',
      sharen: '',
    };
    const author = {
      link: '',
      username: '',
      name: '',
    };

    const music = {
      url: '',
      name: '',
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
