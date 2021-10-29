const _ = require("lodash");
const debug = require("debug")("lib:curly");
const { curly } = require("node-libcurl");
const fs = require("fs");
const utils = require("./utils");

function lookForJSONblob(data) {
  // Questa funzione potrebbe essere instabile
  // Permettendoci una licenza poetica:
  // Stà come d'autuno, sugli alberi, ed è una foglia secca con sopra un bruco affamato.
  const dumblist = data.split("ytInitialData = ");
  const largestr = dumblist[1]
    .replace(/[\n\t\r]/g, "")
    .replace(/}};<.script.*/g, "}}");
  debug("stripped %d ", largestr.length - dumblist[1].length);
  try {
    const blob = JSON.parse(largestr);
    debug(
      "Success in parsing JSON: <%d, %d, %j>",
      _.size(largestr),
      _.size(dumblist),
      _.map(dumblist, _.size)
    );
    return blob;
  } catch (error) {
    debug(
      "Error in parsing JSON: %s <%d, %d, %j>",
      error.message,
      _.size(largestr),
      _.size(dumblist),
      _.map(dumblist, _.size)
    );
    const logf = "tmp-log-" + _.random(0, 0xfffff) + ".json";
    dumblist.push(largestr);
    fs.writeFileSync(logf, JSON.stringify(dumblist, null, 2), "utf-8");
    return null;
  }
}

async function recentVideoFetch(channelId) {
  const ytvidsurl = `https://www.youtube.com/channel/${channelId}/videos`;
  const { statusCode, data, headers } = await curly.get(ytvidsurl, {
    verbose: false,
    timeoutMs: 4000,
    sslVerifyPeer: false,
    followLocation: true,
  });

  debug("CURL from youtube %d", statusCode);
  const blob = lookForJSONblob(data);
  const videob = _.filter(
    blob.contents.twoColumnBrowseResultsRenderer.tabs,
    function (tabSlot) {
      /* if(tabSlot.tabRenderer && tabSlot.tabRenderer.title)
        debug("%s", tabSlot.tabRenderer.title); */
      return (
        tabSlot.tabRenderer &&
        tabSlot.tabRenderer.title &&
        (
          tabSlot.tabRenderer.title === "Videos" ||
          tabSlot.tabRenderer.title === "Video" ||
          tabSlot.tabRenderer.title === "Vidéos")
      );
      // warning this depends from the server locale
      // for example in Germany is
      // Übersicht Videos Playlists Community Kanäle Kanalinfo
    }
  );

  if (!videob.length) {
    debug("Not found the expected HTML/JSON in channel %s", channelId);
    // note on the debug above — perhaps it is the language?
    return null;
  }

  let videonfo = [];
  try {
    videonfo = videob[0].tabRenderer.content.sectionListRenderer.contents[0]
      .itemSectionRenderer.contents[0].gridRenderer.items;
  } catch(error) {
    debug("Error in reading Machine Readable format: %s", error.message);
  }

  const videtails = _.compact(
    _.map(videonfo, function (ve) {
      return ve.gridVideoRenderer;
    })
  );
  const titlesandId = _.map(videtails, function (ve) {
    return {
      videoId: ve.videoId,
      title: ve.title.runs[0].text,
      urlId: utils.hash({
        url: `https://www.youtube.com/watch?v=${ve.videoId}`,
      }),
      description: "",
      recommendations: []
    };
  });

  if (titlesandId.length === 0) {
    debug("Not found the video details in channel %s", channelId);
  }
  return titlesandId;
}

const tokenRegexp = /\[(youchoose):(\w+)\]/;

async function tokenFetch(channelId) {
  const ytvidsurl = `https://www.youtube.com/channel/${channelId}/about`;
  const { statusCode, data, headers } = await curly.get(ytvidsurl, {
    verbose: false,
    timeoutMs: 4000,
    sslVerifyPeer: false,
    followLocation: true,
  });

  debug("Retrieved channel about, length: %d", data.length);
  const match = data.match(tokenRegexp);
  if (match === null) {
    debug("Token not found in %s", ytvidsurl);
    throw new Error("Token not found.");
  } else {
    debug("Token found!, %s", match[2]);
  }

  const blob = lookForJSONblob(data);
  // beside the token, once we've the HTML we have to extract
  // a few information about the channel.
  if (!blob) {
    debug("Returning a mock of a profile because of parsing errors");
    return {
      code: match[2],
      avatar: "TBD",
      username: "TBD",
      url: "TBD",
      channelId: "TBD",
    };
  }

  const avatar =
    blob.microformat.microformatDataRenderer.thumbnail.thumbnails[0].url;
  // 'https://yt3.ggpht.com/ytc/AKedOLSYIgRE6RUgsgcL9a1CoBCLtLPP9UWm6lp5ig=s200-c-k-c0x00ffffff-no-rj?days_since_epoch=18919'
  const username = blob.microformat.microformatDataRenderer.title;
  // 'temporaryworkaround'
  const url = blob.microformat.microformatDataRenderer.urlCanonical;
  // 'https://www.youtube.com/channel/UCbaf8gVrbDzolaeMtP3-XhA'

  return {
    avatar,
    username,
    avatar,
    channelId,
    url,
    code: match[2],
  };
}

module.exports = {
  recentVideoFetch,
  tokenFetch,
};
