import { fc } from '@shared/test';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import { HomeProcessResult } from '../../../parsers/home';
import { VideoResult } from '../../../parsers/video';

const videoResultProps = propsOmit(VideoResult, ['recommendedPubTime']);

export const VideoResultArb = getArbitrary(
  t.strict({
    ...videoResultProps,
  })
);
