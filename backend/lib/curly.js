const _ = require('lodash');
const debug = require('debug')('lib:curly');
const { curly } = require('node-libcurl');

async function experimentalFetch(channelId) {
  // Questa funzione potrebbe essere instabile
  // Permettendoci una licenza poetica:
  // Stà come d'autuno, sugli alberi, ed è una foglia secca con sopra un bruco affamato.

  const ytvidsurl = `https://www.youtube.com/channel/${channelId}/videos`;
  const { statusCode, data, headers } = await curly.get(ytvidsurl, {
    verbose: false,
    timeoutMs: 4000,
    sslVerifyPeer: false,
    followLocation: true
  });

  debug("CURL from youtube %d", statusCode);
  const dumblist = data.split('ytInitialData = ');
  const largestr = dumblist[1].replace(/}};<\/script>.*/g, '}}');
  let blob = null;
  try {
    blob = JSON.parse(largestr);
    debug("Success in parsing JSON: <%d, %d, %j>",
      _.size(largestr), _.size(dumblist),
      _.map(dumblist, _.size)
    );
  } catch(error) {
    debug("Error in parsing JSON: %s <%d, %d, %j>",
      error.message,
      _.size(largestr), _.size(dumblist),
      _.map(dumblist, _.size)
    );
    return null;
  }
  const videob = _.filter(blob.contents.twoColumnBrowseResultsRenderer.tabs,
    function(tabSlot) {
      if(tabSlot.tabRenderer && tabSlot.tabRenderer.title)
          debug("%s", tabSlot.tabRenderer.title);
      return (tabSlot.tabRenderer &&
        tabSlot.tabRenderer.title &&
        tabSlot.tabRenderer.title === 'Videos');
        // warning this depends from the server locale
        // for example in Germany is 
        // Übersicht Videos Playlists Community Kanäle Kanalinfo
  });

  if(!videob.length) {
    debug("Not found the expected piece in channel %s", channelId);
    return null;
  }
  const videonfo = videob[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].gridRenderer.items;
  const videtails = _.compact(_.map(videonfo, function(ve) { return ve.gridVideoRenderer }));
  const titlesandId = _.map(videtails, function(ve) { return { videoId: ve.videoId, title: ve.title.runs[0].text }})

  if(titlesandId.length === 0) {
    debug("Not found the video details in channel %s", channelId);
  }
  return titlesandId;
};

module.exports = {
  experimentalFetch
}