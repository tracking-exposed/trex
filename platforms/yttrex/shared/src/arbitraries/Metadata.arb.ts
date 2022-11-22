import { fc } from '@shared/test';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import {
  HomeMetadata,
  ParsedInfo,
  VideoMetadata,
} from '../models/metadata/Metadata';
import { subDays } from 'date-fns';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';

export const ParsedInfoArb = getArbitrary(
  t.strict({
    ...ParsedInfo.type.props,
    recommendedPubTime: t.unknown,
    publicationTime: t.unknown,
    params: t.unknown,
  })
).map((pi) => ({
  ...pi,
  recommendedPubTime: fc.sample(
    fc.oneof(fc.constant(undefined), fc.date()),
    1
  )[0],
  publicationTime: fc.sample(fc.date(), 1)[0],
  params: fc.sample(fc.dictionary(fc.string(), fc.string()), 1)[0],
}));

/**
 * Ad arbitrary
 *
 **/

const videoMetadataProps = propsOmit(VideoMetadata, [
  'id',
  'clientTime',
  'savingTime',
  'publicationTime',
  'params',
  'related',
]);
export const VideoMetadataArb = getArbitrary(
  t.strict({
    ...videoMetadataProps,
    clientTime: t.unknown,
    savingTime: t.unknown,
    publicationTime: t.unknown,
    params: t.unknown,
    related: t.array(t.unknown),
  })
).map((ad) => ({
  ...ad,
  id: fc.sample(fc.uuid(), 1)[0],
  savingTime: subDays(new Date(), fc.sample(fc.nat(), 1)[0]),
  clientTime: fc.sample(fc.date(), 1)[0],
  publicationTime: fc.sample(fc.date(), 1)[0],
  params: fc.sample(fc.dictionary(fc.string(), fc.string()), 1)[0],
  related: fc.sample(ParsedInfoArb),
}));

const homeMetadataProps = propsOmit(HomeMetadata, [
  'id',
  'clientTime',
  'savingTime',
  'selected',
]);

export const HomeMetadataArb = getArbitrary(
  t.strict({
    ...homeMetadataProps,
    clientTime: t.unknown,
    savingTime: t.unknown,
    selected: t.array(t.unknown),
  })
).map((hm) => ({
  ...hm,
  id: fc.sample(fc.uuid(), 1)[0],
  metadataId: fc.sample(fc.uuid(), 1)[0],
  clientTime: fc.sample(fc.date(), 1)[0],
  savingTime: fc.sample(fc.date(), 1)[0],
  selected: fc.sample(ParsedInfoArb),
}));
