const _ = require('lodash');
const debug = require('debug')('yttrex:ytapi');
const nconf = require('nconf');
const fetch = require('node-fetch');

nconf
    .argv()
    .env()
    .file('config/settings.json')
    .file('auth', 'config/secrets.json');

const ytkey = nconf.get('auth.ytkey') || nconf.get('ytkey');
if(!ytkey)
    return console.log("--ytkey (Youtube API key) required, and can be deposit in config/secrets.json");

if(!nconf.get('channel'))
    return console.log("--channel it is mandatory to know what you want to query");

async function performChannelQuery(key, channel) {
    debug("performChannelQuery for %s", channel);

    const apiurl = `https://www.googleapis.com/youtube/v3/channels?key=${key}&forUsername=${channel}&part=snippet,contentDetails,contentOwnerDetails,topicDetails,statistics&order=date&maxResults=20`;

    console.log(apiurl);
    try {
        const response = await fetch(apiurl);
        const body = await response.json();
        debug(body);
    } catch(error) {
        console.error(error);
    }
}

console.log("This experiment wasn't successful as expected!")
performChannelQuery(ytkey, nconf.get('channel'));
