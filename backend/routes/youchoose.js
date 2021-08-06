const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:youchoose');

const automo = require('../lib/automo');
const params = require('../lib/params');
const utils = require('../lib/utils');
const CSV = require('../lib/CSV');

async function byVideoId(req) {
    debug(req.body);

    const mockup = [
        {
            "video_id": "-1Koo7DC4vs",
            "name": "name 1",
            uploader: "boh?",
            duration: "00:01:01"
        },
        {
            "video_id": "lHMlLCMkuPE",
            name: "name 2",
            uploader: "focaccia",
            duration: "01:00:00"
        }
    ]
    return { json: mockup };
};

module.exports = {
    byVideoId,
};
