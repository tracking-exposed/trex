const _ = require('lodash');
const debug = require('debug')('routes:directives');
const nconf = require('nconf');
// const automo = require('../lib/automo');
// const utils = require('../lib/utils');
const experlib = require('../lib/experiments');
const mongo3 = require('../lib/mongo3');

// function reproducibleTypo(title) {
//   const trimmedT = title.replace(/.$/, '').replace(/^./, '');
//   return trimmedT; /*
//   const stats = _.countBy(_.flatten(_.chunk(trimmedT)));
//   let selection = null;
//   _.each(_.reverse(stats), function(amount, letter) {
//     if(!selection && amount === 1)
//       selection = letter;
//   });
//   if(!selection)
//     selection = _.last(stats).letter;

//   injection = ' з ';
//   const chunks = trimmedT.split(selection);
//   return chunks.join(injection); */
// }

function searchesDirectory(query, counter) {
  const url = 'https://tiktok.com/search?q=' + encodeURIComponent(query);
  return {
    url,
    loadFor: 5500,
    name: `search-for-${query}-${counter}`,
    query,
  };
}

async function post(req) {
  /* remind self guardoni0 non fa registerDirective, codice mai chiamato sotto */
  const directiveType = _.get(req.params, 'directiveType', '');
  const directiveTypes = ['search'];

  if (directiveTypes.indexOf(directiveType) === -1) {
    debug(
      'Invalid directive type (%s), supported %j)',
      directiveType,
      directiveTypes
    );
    return { json: { error: true, message: 'Invalid directive type' } };
  }

  /* warning, this is different from YOUTUBE, it uses a list of
   * queries instead of a CSV format parsed. */

  const directives = req.body; // parsedCSV was the name from guardoni fmt

  debug(
    'Registering directive %s (%d urls)',
    directiveType,
    _.size(directives)
  );

  const feedback = await experlib.registerDirective(directives, directiveType);
  // this feedback is printed at terminal when --csv is used
  return { json: feedback };
}

async function get(req) {
  const experimentId = req.params.experimentId;
  // const links = req.params.links;
  debug('GET: should return directives for %s', experimentId);
  const expinfo = await experlib.pickDirective(experimentId);

  debug('Directive %O', expinfo);
  // if(expinfo.directiveType === 'search')
  const directives = expinfo.directives;
  debug(
    'search directive type %s produced %d',
    experimentId,
    directives.length
  );
  return { json: directives };
}

async function getPublic(req) {
  const blackList = [
    // 'b3d531eca62b2dc989926e0fe21b54ab988b7f3d',
    // prod ids
    'd75f9eaf465d2cd555de65eaf61a770c82d59451',
    '37384a9b7dff26184cdea226ad5666ca8cbbf456',
  ];

  const filter = {
    experimentId: {
      $nin: blackList,
    },
  };

  const mongoc = await mongo3.clientConnect({ concurrency: 1 });

  const publicDirectives = await mongo3.readLimit(
    mongoc,
    nconf.get('schema').directives,
    filter,
    { when: -1 },
    20,
    0
  );

  await mongoc.close();

  return {
    json: publicDirectives,
  };
}

module.exports = {
  searchesDirectory,
  post,
  get,
  getPublic,
};
