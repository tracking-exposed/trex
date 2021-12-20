import { fc } from "@shared/test";
import { getArbitrary } from "fast-check-io-ts";
import { Metadata, ParsedInfo } from "../../models/Metadata";
import * as t from "io-ts";


export const ParsedInfoArb = getArbitrary(
  t.strict({
    ...ParsedInfo.types[0].type.props,
    ...ParsedInfo.types[1].props
  })
)

/**
 * Ad arbitrary
 *
 **/

export const VideoMetadataArb = getArbitrary(
  t.strict({
    ...Metadata.types[0].type.props,
    ...Metadata.types[1].types[0].type.props,
    clientTime: t.unknown,
    savingTime: t.unknown,
    publicationTime: t.unknown,
  })
).map((ad) => ({
  ...ad,
  id: fc.sample(fc.uuid(), 1)[0],
  savingTime: fc.sample(fc.date(), 1)[0],
  clientTime: fc.sample(fc.date(), 1)[0],
}));
