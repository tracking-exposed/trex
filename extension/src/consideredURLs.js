/* eslint-disable */

// Considering the extension only runs on *.youtube.com
// we want to make sure the main code is executed only in
// website portion actually processed by us. If not, the
// blink maker would blink in BLUE.
// This code is executed by a window.setInterval because 
// the location might change

export default {
  'home': new RegExp(/^\/$/),
  'video': new RegExp(/^\/watch$/),
  'search': new RegExp(/^\/results$/),
  'hashtag': new RegExp(/^\/hashtag/),
  'feed': new RegExp(/^\/feed/),
  'channel': new RegExp(/^\/channel/),
};
