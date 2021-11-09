const _ = require("lodash");
const debug = require("debug")("lib:curly");
const { curly } = require("node-libcurl");
const fs = require("fs");
const path = require("path");
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

async function fetchRawChannelVideosHTML(channelId) {
  const url = `https://www.youtube.com/channel/${channelId}/videos`;
  const { statusCode, data, headers } = await curly.get(url, {
    verbose: false,
    timeoutMs: 4000,
    sslVerifyPeer: false,
    followLocation: true,
  });

  return {
    headers,
    statusCode,
    html: data,
  };
}

const parseRecentVideosHTML = (html) => {
  const blob = lookForJSONblob(html);
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
    throw new Error("Not found the expected HTML/JSON in channel %s.");
    // note on the debug above — perhaps it is the language?
  }

  let videonfo = [];
  try {
    videonfo = videob[0].tabRenderer.content.sectionListRenderer.contents[0]
      .itemSectionRenderer.contents[0].gridRenderer.items;
  } catch(error) {
    throw new Error(
      `Error in reading Machine Readable format: ${error.message}`
    );
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
    throw new Error("Not found the video details in channel %s");
  }

  return titlesandId;
};

async function recentVideoFetch(channelId) {
  // log the raw HTML and results of this function for future debugging
  // or regression testing
  const logDir = path.join(
    __dirname,
    `../logs/recentVideoFetch_${channelId}_${Date.now()}`
  );
  fs.mkdirSync(logDir);
  const callLog = {
    method: "recentVideoFetch",
    channelId,
    success: false,
  };
  // function to write the log in JSON to the log file
  const log = (extraData) => {
    fs.writeFileSync(path.join(logDir, "call.json"), JSON.stringify(
      Object.assign(
        {}, callLog, extraData,
    ), null, 2));
  };

  const { html, statusCode } = await fetchRawChannelVideosHTML(channelId);
  debug("CURL from youtube %d", statusCode);

  // save raw HTML
  fs.writeFileSync(path.join(logDir, "raw.html"), html);
  debug("recentVideoFetch saved raw.html and call.json in %s", logDir);

  // parse the HTML
  try {
    const titlesandId = parseRecentVideosHTML(html);
    log({
      success: true,
      result: titlesandId,
    });
    return titlesandId;
  } catch (err) {
    log({
      success: false,
      message: err.message,
    });
    debug(err.message, channelId);
    return [];
  }
}

const tokenRegexp = /\[(youchoose):(\w+)\]/;

async function tokenFetch(channelId) {
  const ytvidsurl = `https://www.youtube.com/channel/${channelId}/about`;
  // const { statusCode, data, headers } = await curly.get
  const { data } = await curly.get(ytvidsurl, {
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
    channelId,
    url,
    code: match[2],
  };
}

module.exports = {
  fetchRawChannelVideosHTML,
  parseRecentVideosHTML,
  recentVideoFetch,
  tokenFetch,
};
