const _ = require('lodash');
const debug = require('debug')('parsers:hashtags');
const querystring = require('querystring');

function hashtags(envelop, previous) {

  const iframes = envelop.jsdom.querySelectorAll('iframe');
  const meaningful = _.filter(iframes, function(iframe) {
    return iframe.parentNode.querySelectorAll('img').length
  });
  debug("From %d iframes we kept %d meaningful",
    iframes.length, meaningful.length);

  const srcs = _.map(meaningful, function(iframe) {
    try {
      return findAllTj(iframe.parentNode.innerHTML.replace(/\n/g, ''));
    } catch(error) {
      console.log("Line 67 advertising.js:", error);
      return null;
    }
  });
  return { hashtags: _.flatten(srcs) };
};

module.exports = hashtags;
