import { fc } from "@shared/test";
import { getArbitrary } from "fast-check-io-ts";
import { fst } from "fp-ts/lib/ReadonlyTuple";
import { fixHumanizedTime } from "parsers/shared";
import { Metadata } from "../../models/Metadata";
import * as t from "io-ts";

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
