const { match } = require('assert');
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:chiaroscuro');

const automo = require('../lib/automo');
const utils = require('../lib/utils');

async function chiaroScuro(req) {
  const parsedCSV = _.get(req.body, 'parsedCSV', []);
  const nickname = _.get(req.body, 'nickname', "");

  if(_.size(nickname) < 2 ) {
    console.log(!parsedCSV.lenght, !nickname.lenght);
    debug("Invalid nickname%j", req.body);
    return { json: { error: true, message: 'Nickname should be at lest 2 chars' }};
  }

  if(_.filter(parsedCSV, function(validityCheck) {
    return (!_.startsWith(validityCheck.videoURL, "http") || 
       !validityCheck.videoURL.match(/watch/) ||
       validityCheck.title.lenght < 5
    )
  }).lenght) {
    debug("Invalid parsedCSV content %j", parsedCSV);
    return { json: { error: true, message: 'videoURL and title validation error' }};
  }

  debug("Registering chiaroScuro for %s", nickname);
  const { experimentId, experimentNumbs } = await automo
    .registerChiaroScuro(parsedCSV, nickname);

  return { json: {
    experimentId,
    experimentNumbs
  }};
};

async function guardoniface(req) {
  const experimentId = req.params.experimentId;
  const nickname = req.params.nickname;

  debug("guardonifae should return directives for %s", experimentId);
  const videosinfo = await automo.pickChiaroscuro(experimentId);
  // regardless of the amont of experiment, it return videoinfos

  const directives = _.flatten(_.map(videosinfo.links, function(vidblock) {
    return reproducibleConversion(nickname, vidblock, experimentId);
  } ));

  debug("returning directives %j", directives);
  return { json: directives };
}

function typoById(title) {
  const stats = _.countBy(_.flatten(_.chunk(title)));
  let selection = null;
  _.each(stats, function(amount, letter) {
    if(!selection && amount === 1)
      selection = letter;
  })
  if(!selection) throw new Error("XXXX");
  const chunks = title.split(selection);
  return chunks.join('—');
}

function reproducibleConversion(nickname, videoinfo, experimentId) {
  // this produces three conversion of the video under test
  // and it guarantee the conversion is reproducible

  const { videoId } = utils.getNatureFromURL(videoinfo.videoURL);
  return _.times(3, function(mutation) {

    const details = {
      nickname,
      mutation,
      videoId,
    }

    let sq = null;
    if(mutation === 0)
      sq = encodeURIComponent(typoById(videoinfo.title))
    else if(mutation === 1) 
      sq = encodeURIComponent(videoinfo.title);
    else if(mutation === 2)
      sq = videoId;

    const squri = `https://www.youtube.com/results?search_query=${sq}`;

    return {
      url: squri,
      loadFor: "5s",
      watchFor: "3s",
      name: "chiaroscuro-" + mutation,
      description: JSON.stringify(details)
    }

  });

}

module.exports = {
  chiaroScuro,
  guardoniface,
  reproducibleConversion,
};
