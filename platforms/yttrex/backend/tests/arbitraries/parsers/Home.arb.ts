import { fc } from '@shared/test';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import { HomeProcessResult } from '../../../parsers/home';
import { VideoResultArb } from './Video.arb';

const htmlMetadataProps = propsOmit(HomeProcessResult, ['id', 'selected']);
export const HTMLMetadataResult = getArbitrary(
  t.strict({
    ...htmlMetadataProps,
  })
).map((m) => ({
  ...m,
  selected: fc.sample(VideoResultArb, 5),
}));
