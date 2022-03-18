import { fc } from '@shared/test';
import { propsOmit } from '@shared/utils/arbitrary.utils';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';
import { Metadata, ParsedInfo } from '../../models/Metadata';

export const ParsedInfoArb = getArbitrary(
  t.strict({
    ...ParsedInfo.types[0].type.props,
    ...ParsedInfo.types[1].props,
  })
);

/**
 * Ad arbitrary
 *
 **/

const videoMetadataProps = propsOmit(Metadata.types[0], [
  'id',
  'clientTime',
  'savingTime',
  'publicationTime',
]);
export const VideoMetadataArb = getArbitrary(
  t.strict({
    ...videoMetadataProps,
    clientTime: t.unknown,
    savingTime: t.unknown,
    publicationTime: t.unknown,
  })
).map((ad) => ({
  ...ad,
  id: fc.sample(fc.uuid(), 1)[0],
  savingTime: fc.sample(fc.date(), 1)[0],
  clientTime: fc.sample(fc.date(), 1)[0],
  publicationTime: fc.sample(fc.date(), 1)[0],
}));

const homeMetadataProps = propsOmit(Metadata.types[1], [
  'id',
  'metadataId',
  'clientTime',
  'savingTime',
]);

export const HomeMetadataArb = getArbitrary(
  t.strict({
    ...homeMetadataProps,
    clientTime: t.unknown,
    savingTime: t.unknown,
  })
).map((hm) => ({
  ...hm,
  id: fc.sample(fc.uuid(), 1)[0],
  metadataId: fc.sample(fc.uuid(), 1)[0],
  clientTime: fc.sample(fc.date(), 1)[0],
  savingTime: fc.sample(fc.date(), 1)[0],
}));
