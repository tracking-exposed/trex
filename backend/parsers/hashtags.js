const _ = require('lodash');
const debug = require('debug')('parsers:advertising');
const querystring = require('querystring');

function forceClean(uncleanStr) {
  const clean = uncleanStr
    .split('\n')[0]
    .split('\t')[0]
    .replace(/\ *./,'')
    .replace(/'\);/,'');
  const urlo = new URL(clean);
  const params = querystring.parse(urlo.search);
  const decoded = _.reduce(params, function(memo, value, key) {
    _.set(memo, key, decodeURI(value));
    return memo;
  }, {});
  if(_.keys(decoded).length) {
    return {
      url: clean,
      params: decoded,
    }
  }
  return null;
}

function findAllTj(html) {
  // console.log(html.split('ads.trafficjunky.net').length);
  const rv = _.reduce(html.split('ads.trafficjunky.net'), function(memo, chunk, i) {
    let match = memo.source.match(/https:\/\/ads\.trafficjunky\.net/);
    if(!match)
      return memo;

    // console.log(i, "match at", match.index);
    let uncleanStr = memo.source.substr(match.index -1, 2000);
    let values = forceClean(uncleanStr);

    if(values)
      memo.urls.push(values);

    // console.log(`URLs ${memo.urls.length} & ${_.size(memo.source)}`);
    try {
      memo.source = memo.source.substr(match.index + values ?
        _.size(values.url) : _.size(uncleanStr));
    } catch(error) {
      console.log("Line 45 advertising.js:", error);
      memo.source = "";
    }
    // console.log("size left is:", _.size(memo.source));
    return memo;
  }, { source: html, urls: [] });
  return rv.urls;
}

function advertising(envelop, previous) {

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
  return { advertising: _.flatten(srcs) };
};

module.exports = advertising;
