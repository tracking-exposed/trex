import fc from "fast-check";
import { getArbitrary } from "fast-check-io-ts";
import { Recommendation } from "../models/Recommendation";

export const RecommendationArb = getArbitrary(Recommendation).map((r) => ({
  ...r,
  urlId: fc.sample(fc.uuid(), 1)[0],
  url: fc.sample(fc.webUrl(), 1)[0]
}));
