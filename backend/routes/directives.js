const _ = require('lodash');
const debug = require('debug')('routes:directives');

const automo = require('../lib/automo');
const utils = require('../lib/utils');

function validateChiaroscuro(parsedCSV) {
  if(_.filter(parsedCSV, function(validityCheck) {
    return (!_.startsWith(validityCheck.videoURL, "http") || 
       !validityCheck.videoURL.match(/watch/) ||
       validityCheck.title.length < 5
    )
  }).length) {
    debug("Invalid parsedCSV content %j", parsedCSV);
    return { json: { error: true, message: 'videoURL and title validation error' }};
  }
}

function validateComparison(parsedCSV) {
  debug("Let's say it is ok");
}

async function post(req) {
  const directiveType = _.get(req.params, 'directiveType', "");
  const directiveTypes = [
    "chiaroscuro", "comparison"
  ];

  if(directiveTypes.indexOf(directiveType) === -1) {
    debug("Invalid directive type (%s), supported %j)",
      directiveType, directiveTypes);
    return { json: { error: true, message: "Invalid directive type"}};
  }

  const parsedCSV = _.get(req.body, 'parsedCSV', []);
  const evidencetag = _.get(req.body, 'evidencetag', null);

  if(directiveType === directiveTypes[0])
    validateChiaroscuro(parsedCSV);
  if(directiveType === directiveTypes[1])
    validateComparison(parsedCSV);


  debug("Registering directive %s for %s (%d urls)",
    directiveType, evidencetag, _.size(parsedCSV));

  const experimentId  = await automo
    .registerDirective(parsedCSV, evidencetag);

  return { json: { experimentId }};
};

async function get(req) {
  const experimentId = req.params.experimentId;

  debug("GET: should return directives for %s", experimentId);
  const videosinfo = await automo.pickDirective(experimentId);
  // regardless of the amont of experiment, it return videoinfos

  throw new Error("not yet implemented here");
  const directives = _.flatten(_.map(videosinfo.links, function(vidblock, counter) {
    return chiaroScuroReproducibleTypo(evidencetag, vidblock, experimentId, counter);
  } ));

  debug("returning %d", directives.length);
  return { json: directives };
}

function chiaroScuroReproducibleTypo(title) {
  let trimmedT = title.replace(/.$/, '').replace(/^./, '');
  return trimmedT
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
  return chunks.join(injection);
}

function reproducibleConversion(evidencetag, videoinfo, experimentId, counter) {
  // this produces three conversion of the video under test
  // and it guarantee the conversion is reproducible

  const { videoId } = utils.getNatureFromURL(videoinfo.videoURL);
  return _.times(2, function(mutation) {

    let sq = null;
    let mutationStr = "";
    if(mutation === 0) {
      mutationStr = "trimming";
      sq = encodeURIComponent(reproducibleTypo(videoinfo.title))
    }
    else if(mutation === 1)  {
      mutationStr = "exact-title";
      sq = encodeURIComponent(videoinfo.title);
    }
    else if(mutation === 2) {
      mutationStr = "videoId";
      sq = videoId;
    }

    const squri = `https://www.youtube.com/results?search_query=${sq}`;

    return {
      url: squri,
      loadFor: "11s",
      name: mutationStr,
      targetVideoId: videoId,
      description: evidencetag + counter + mutation
    }

  });

}

module.exports = {
  chiaroScuroReproducibleTypo,
  post,
  get,
};
