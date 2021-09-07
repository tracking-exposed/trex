import { command } from "avenger";
import { recommendations } from "./queries";
import { fetch } from "./HTTPAPI";

export const addRecommendation = command((r) => fetch(`/ogp/${r}`), {
  recommendations,
});
