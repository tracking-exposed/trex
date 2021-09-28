/*
 * A list of youtube specific function to parse and assess URLs or conditions
 */

import url from 'url';
import querystring from 'querystring';

export function getVideoId(
  locationhref: string
): string | string[] | undefined {
  const urlinfo = new url.URL(locationhref);
  const p = querystring.parse(urlinfo.search);
  return p.v;
}
