import { available, queryStrict, refetch } from "avenger";
import { fetch } from "./HTTPAPI";

const publicKey = "not-implemented-yet";

export const recommendations = 
  queryStrict((params) => {
    return fetch(`/profile/recommendations/${publicKey}`, params);
  }, refetch);

export const creatorVideos = queryStrict((params) => {
  // url (videoId)
  // thumbnail
  // title
  // publication date
  // recommendations: number
  return fetch(`/profile/`);
}, available);
