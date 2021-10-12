const _ = require('lodash');
const debug = require('debug')('lib:curly');
const { curly } = require('node-libcurl');
const fs = require('fs');

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
  const largestr = dumblist[1].replace(/[\n\t\r]/g,"").replace(/}};<.script.*/g, '}}');
  debug("stripped %d ", largestr.length - dumblist[1].length)
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
    const logf = "tmp-log-" + _.random(0, 0xfffff) + ".json";
    dumblist.push(largestr);
    fs.writeFileSync(logf, JSON.stringify(dumblist, null, 2), 'utf-8');
    return null;
  }
  const videob = _.filter(blob.contents.twoColumnBrowseResultsRenderer.tabs,
    function(tabSlot) {
      /* if(tabSlot.tabRenderer && tabSlot.tabRenderer.title)
        debug("%s", tabSlot.tabRenderer.title); */
      return (tabSlot.tabRenderer &&
        tabSlot.tabRenderer.title &&
        (tabSlot.tabRenderer.title === 'Videos' || tabSlot.tabRenderer.title === 'Video') );
        // warning this depends from the server locale
        // for example in Germany is 
        // Übersicht Videos Playlists Community Kanäle Kanalinfo
  });

  if(!videob.length) {
    debug("Not found the expected HTML/JSON in channel %s", channelId);
    // note on the debug above — perhaps it is the language?
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

async function tokenFetch(channelId) {

  const ytvidsurl = `https://www.youtube.com/channel/${channelId}/about`;
  const { statusCode, data, headers } = await curly.get(ytvidsurl, {
    verbose: false,
    timeoutMs: 4000,
    sslVerifyPeer: false,
    followLocation: true
  });

  debug("Retrieved channel about, length: %d", data.length);
  const s = data.split("YTTREX-");
  const la = s[1].split("-ENDC0DE");

  return la[0];
}

module.exports = {
  experimentalFetch,
  tokenFetch,
}
