/*
 * A list of youtube specific function to parse and assess URLs or conditions
 */

const url = require('url');
const querystring = require('querystring');

export function getVideoId(locationhref) {
  const urlinfo = url.URL(locationhref);
  const p = querystring.parse(urlinfo.query);
  return p.v;
}
