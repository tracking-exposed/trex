const _ = require('lodash');
const debug = require('debug')('routes:directives');

const automo = require('../lib/automo');
const utils = require('../lib/utils');
const experlib = require('../lib/experiments');

function reproducibleTypo(title) {
  const trimmedT = title.replace(/.$/, '').replace(/^./, '');
  return trimmedT; /*
  const stats = _.countBy(_.flatten(_.chunk(trimmedT)));
  let selection = null;
  _.each(_.reverse(stats), function(amount, letter) {
    if(!selection && amount === 1)
      selection = letter;
  });
  if(!selection)
    selection = _.last(stats).letter;

  injection = ' з ';
  const chunks = trimmedT.split(selection);
  return chunks.join(injection); */
}


function searchesDirectory(query, counter) {
  const url = "https://tiktok.com/search?q=" + encodeURIComponent(query);
  console.log(url);
  return {
    url,
    loadFor: 5500,
    name: `search-for-${query}-${counter}`,
    query,
  }
}

async function post(req) {
  /* remind self guardoni0 non fa registerDirective, codice mai chiamato sotto */
  const directiveType = _.get(req.params, 'directiveType', "");
  const directiveTypes = [ "search" ];

  if(directiveTypes.indexOf(directiveType) === -1) {
    debug("Invalid directive type (%s), supported %j)",
      directiveType, directiveTypes);
    return { json: { error: true, message: "Invalid directive type"}};
  }

  /* warning, this is different from YOUTUBE, it uses a list of
   * queries instead of a CSV format parsed. */

  const data = req.body; // parsedCSV was the name from guardoni fmt
  console.log(data);

  const links = data;
  console.log(_.keys(data));
  debug("Registering directive %s (%d urls)",
    directiveType, _.size(links));

  const feedback = await experlib
    .registerDirective(links, directiveType);
  // this feedback is printed at terminal when --csv is used
  return { json: feedback };
};

async function get(req) {
  const experimentId = req.params.experimentId;
  const links = req.params.links;
  debug("GET: should return directives for %s", experimentId);
  const expinfo = await experlib.pickDirective(experimentId);

  console.log(expinfo);
  // if(expinfo.directiveType === 'search')
  const directives = _.map(expinfo.links, "searches");
  debug("search directive type %s produced %d", experimentId, directives.length);
  return { json: directives };
}

module.exports = {
  searchesDirectory,
  post,
  get,
};
