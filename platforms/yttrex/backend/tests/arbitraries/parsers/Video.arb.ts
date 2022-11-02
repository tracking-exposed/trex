import { propsOmit } from '@shared/utils/arbitrary.utils';
import { ParsedInfo } from '@yttrex/shared/models/metadata/Metadata';
import { getArbitrary } from 'fast-check-io-ts';
import * as t from 'io-ts';

const videoResultProps = propsOmit(t.strict({ ...ParsedInfo.types[1].props }), [
  'recommendedPubTime',
]);

export const VideoResultArb = getArbitrary(
  t.strict({
    ...ParsedInfo.types[0].type.props,
    ...videoResultProps,
  })
);
