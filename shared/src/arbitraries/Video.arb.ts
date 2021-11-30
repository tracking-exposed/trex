import fc from "fast-check";
import { getArbitrary } from "fast-check-io-ts";
import { Video } from "../models/Video";

/**
 * Video arbitrary
 *
 * */
export const VideoArb = getArbitrary(Video).map((r) => ({
  ...r,
  videoId: fc.sample(fc.uuid(), 1)[0],
  recommendations: fc.sample(fc.uuid(), 5),
}));
