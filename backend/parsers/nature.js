const _ = require('lodash');
const debug = require('debug')('parsers:nature');

function addParams(src, dest, namemap) {
  /* src: source object, a new URL
     dest: the retval dict
     namemap: { "name of the parameters" : "name of the key in retval" } */
  const params = new URLSearchParams(src.search)
  const formatted = Array.from(params.entries());
  if(formatted.length) {
    dest.params = _.reduce(formatted, function(memo, o) {
      const dkey = _.get(namemap, o[0]);
      if(!dkey) {
        debug("Unmanaged parameters %s in %s", o[0], src.href);
        return memo;
      }
      const found = _.find(formatted, function(couple) {
        return couple[0] == o[0];
      });
      _.set(memo, dkey, found[1])
      return memo;
    }, {});
    if(namemap["page"] && !dest.params.page) {
      dest.params.page = 1;
    }
  }
}

function nature(envelop, previous) {

  const retval = { type: null };
  const urlO = new URL(envelop.html.href);

  const domainSections = urlO.host.split('.');
  retval.site = domainSections[0];

  if(urlO.pathname == "" || urlO.pathname == "/") {
    retval.type = 'home';
  } else if(urlO.pathname == "/view_video.php") {
    retval.type = 'video';
    addParams(urlO, retval, { viewkey: 'videoId' });
  } else if(_.startsWith(urlO.pathname, "/pornstar")) {
    retval.type = 'pornstar';
    retval.name = urlO.pathname.split('/')[1];
  } else if(_.startsWith(urlO.pathname, "/model")) {
    retval.type = 'model';
    retval.name = urlO.pathname.split('/')[1];
  } else if(urlO.pathname == "/video") {
    retval.type = "list";
    addParams(urlO, retval, {
      c: 'categoryCode',
      cc: 'countryCode',
      page: 'page',
      o: 'option',
    });
  } else if(urlO.pathname == "/video/search") {
    retval.type = "search";
    addParams(urlO, retval, {
      search: 'query',
      page: 'page'
    });
  } else if(urlO.pathname == "/recommended") {
    retval.type = "recommended";
    addParams(urlO, retval, {
      page: 'page',
    });
  } else if(_.startsWith(urlO.pathname, '/categories')) {
    retval.type = "explicitlist";
    retval.name = retval.urlO.pathname.split('/').pop();
  } else {
    retval.type = "unknown";
    debug("not attributed URL pathname %s", urlO.href);
  }

  return retval;
};

module.exports = nature;
