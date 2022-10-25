import _ from 'lodash';
import D from 'debug';
import fetch from 'node-fetch';
// const AbortController = require("abort-controller");
import fs from 'fs';
import path from 'path';
import utils from './utils';

const debug = D('lib:curly');

/*
 * This library allow us to:
 1) Fetch from curl two possible pages from any youtube channel
 2) Save the retrived HTML
 3) Parse a few data present in such pages, to return the information we might need.

The informations we wants to extract is:
 - list of the last 30 published videos/title
 - presence of the authorization secret code
 *
 */

function lookForJSONblob(data: string): any {
  const jsonldinit = data.split('ytInitialData = ');
  const largestr = jsonldinit[1]
    .replace(/[\n\t\r]/g, '')
    .replace(/}};<.script.*/g, '}}');
  debug('stripped %d ', largestr.length - jsonldinit[1].length);
  try {
    const blob = JSON.parse(largestr);
    debug(
      'Success in parsing JSON: <%d, %d, %j>',
      _.size(largestr),
      _.size(jsonldinit),
      _.map(jsonldinit, _.size)
    );
    return blob;
  } catch (error) {
    debug(
      'Error in parsing JSON: %s <%d, %d, %j>',
      error.message,
      _.size(largestr),
      _.size(jsonldinit),
      _.map(jsonldinit, _.size)
    );
    const logf = 'tmp-log-' + _.random(0, 0xfffff) + '.json';
    jsonldinit.push(largestr);
    fs.writeFileSync(logf, JSON.stringify(jsonldinit, null, 2), 'utf-8');
    return null;
  }
}

async function fetchRawChannelVideosHTML(
  channelId: string
): Promise<{ html: string; statusCode: number; headers: any }> {
  const url = `https://www.youtube.com/channel/${channelId}/videos`;
  // const abortCtl = new AbortController();
  // const timeout = setTimeout(() => {
  //   abortCtl.abort();
  // }, 4000);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      // signal: abortCtl.signal,
    });

    if (response.ok) {
      const html = await response.text();
      return {
        html,
        statusCode: response.status,
        headers: response.headers,
      };
    } else throw new Error('Response is not ok');
  } catch (error) {
    return {
      html: '',
      statusCode: 500,
      headers: {},
    };
  }
}

async function verifyChannel(
  channelId
): Promise<boolean | { error: boolean; message: string }> {
  const { html, statusCode } = await fetchRawChannelVideosHTML(channelId);
  debug(statusCode);
  if (statusCode !== 200) {
    const em = `Invalid HTTP Code ${statusCode}`;
    return { error: true, message: em };
  }
  if (html.length < 20000) {
    const em = `Way too small page ${html.length}`;
    return { error: true, message: em };
  }

  const reg = new RegExp(channelId);
  const check = html.match(reg);

  if (check?.index) {
    return true;
  }
  const em = `Failed double check: Unexpected HTML!?`;
  return { error: true, message: em };
}

const parseRecentVideosHTML = (html: string): any => {
  const blob = lookForJSONblob(html);
  const videob = _.filter(
    blob.contents.twoColumnBrowseResultsRenderer.tabs,
    function (tabSlot) {
      /* if(tabSlot.tabRenderer && tabSlot.tabRenderer.title)
        debug("%s", tabSlot.tabRenderer.title); */
      return (
        tabSlot.tabRenderer?.title &&
        (tabSlot.tabRenderer.title === 'Videos' ||
          tabSlot.tabRenderer.title === 'Video' ||
          tabSlot.tabRenderer.title === 'Vidéos')
      );
      // warning this depends from the server locale
      // for example in Germany is
      // Übersicht Videos Playlists Community Kanäle Kanalinfo
    }
  );

  if (!videob.length) {
    throw new Error('Not found the expected HTML/JSON in channel %s.');
    // note on the debug above — perhaps it is the language?
  }

  let videonfo = [];
  try {
    videonfo =
      videob[0].tabRenderer.content.sectionListRenderer.contents[0]
        .itemSectionRenderer.contents[0].gridRenderer.items;
  } catch (error) {
    throw new Error(
      `Error in reading Machine Readable format: ${error.message}`
    );
  }

  const videtails = _.compact(
    _.map(videonfo, function (ve: any) {
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
      description: '',
      recommendations: [],
    };
  });

  if (titlesandId.length === 0) {
    throw new Error('Not found the video details in channel %s');
  }

  return titlesandId;
};

async function recentVideoFetch(channelId: string): Promise<any> {
  // log the raw HTML and results of this function for future debugging
  // or regression testing
  const logDir = path.join(
    __dirname,
    `../logs/recentVideoFetch_${channelId}_${Date.now()}`
  );
  fs.mkdirSync(logDir);
  const callLog = {
    method: 'recentVideoFetch',
    channelId,
    success: false,
  };
  // function to write the log in JSON to the log file
  const log = (extraData: any): void => {
    fs.writeFileSync(
      path.join(logDir, 'call.json'),
      JSON.stringify(Object.assign({}, callLog, extraData), null, 2)
    );
  };

  const { html, statusCode } = await fetchRawChannelVideosHTML(channelId);
  debug('CURL from youtube %d', statusCode);

  // save raw HTML
  fs.writeFileSync(path.join(logDir, 'raw.html'), html);
  debug('recentVideoFetch saved raw.html and call.json in %s', logDir);

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

async function tokenFetch(channelId: string): Promise<any> {
  const ytVidsURL = `https://www.youtube.com/channel/${channelId}/about`;

  const abortCtl = new AbortController();
  const timeout = setTimeout(() => {
    abortCtl.abort();
  }, 4000);
  const response = await fetch(ytVidsURL, {
    redirect: 'follow',
    signal: abortCtl.signal,
  });
  clearTimeout(timeout);
  if (!response.ok) {
    return { code: undefined };
  }

  const data = await response.text();

  debug('Retrieved channel about, length: %d', data.length);
  const match = data.match(tokenRegexp);
  if (match === null) {
    debug('Token not found in %s', ytVidsURL);
    throw new Error('Token not found.');
  } else {
    debug('Token found!, %s', match[2]);
  }

  const blob = lookForJSONblob(data);
  // beside the token, once we've the HTML we have to extract
  // a few information about the channel.
  if (!blob) {
    debug('Returning a mock of a profile because of parsing errors');
    return {
      code: match[2],
      avatar: 'TBD',
      username: 'TBD',
      url: 'TBD',
      channelId: 'TBD',
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

export {
  fetchRawChannelVideosHTML,
  verifyChannel,
  parseRecentVideosHTML,
  recentVideoFetch,
  tokenFetch,
};
