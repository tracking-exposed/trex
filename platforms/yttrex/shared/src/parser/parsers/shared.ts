import D from 'debug';
import URL from 'url';

const debug = D('parser:shared');
const debuge = D('parser:shared:error');

/* shared functions used from video and home */

export const getThumbNailHref = (e: Element): string | null => {
  // e is an 'element' from .querySelectorAll('ytd-compact-video-renderer')
  let thumbnailHref: string | null = null;
  try {
    const refe = e.querySelector('.ytd-thumbnail-overlay-time-status-renderer');
    if (!refe) return null;

    const thumbnailSrc = refe
      .closest('a')
      ?.querySelector('img')
      ?.getAttribute('src');
    if (!thumbnailSrc) return null;

    // eslint-disable-next-line node/no-deprecated-api, n/no-deprecated-api
    const c = URL.parse(thumbnailSrc);
    thumbnailHref = 'https://' + c.host + c.pathname;
  } catch (e) {
    debuge('thumbnail mining error: %s', e.message);
  }
  return thumbnailHref;
};

export function logged(D: Document): boolean | null {
  const avatarN = D.querySelectorAll('button#avatar-btn');
  const loginN = D.querySelectorAll(
    '[href^="https://accounts.google.com/ServiceLogin"]'
  );
  const avalen = avatarN ? avatarN.length : 0;
  const logilen = loginN ? loginN.length : 0;

  // login button | avatar button len
  if (logilen && !avalen) return false;
  if (avalen && !logilen) return true;

  debug('Inconsistent condition avatar %d login %d', avalen, logilen);
  return null;
}

export function fixHumanizedTime(inputstr: string): string {
  // this function fix the time 0:10, 10:10,  in HH:MM:SS
  if (inputstr.length === 4) return '0:0' + inputstr;
  if (inputstr.length === 5) return '0:' + inputstr;
  if (inputstr.length > 9)
    debug('Warning this is weird in fixHumanizedTime: [%s]', inputstr);
  return inputstr;
}