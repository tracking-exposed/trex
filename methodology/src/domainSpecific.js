const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('guardoni:tiktok');
const logreqst = require('debug')('guardoni:requests');
const bconsError = require('debug')('guardoni:error');
const path = require('path');
const url = require('url');
const fs = require('fs');
const nconf = require('nconf');

debug.enabled = logreqst.enabled = true;

const SCREENSHOT_MARKER = "SCREENSHOTMARKER";
const scrnshtrgxp = new RegExp(SCREENSHOT_MARKER);

global.lastScreenTime = moment().subtract(4, 'seconds');
global.currentURLlabel = null;
global.screenshotPrefix = null;
global.interval = null;
global.publicKeySpot = null;

function getScreenshotFilename() {
    /* this function return null if no screenshot has to be taken,
     * and the criteria is to take max one screen every 5 seconds */
    const now = moment();
    if(moment.duration(now - global.lastScreenTime).asSeconds() < 5)
        return null;

    global.lastScreenTime = now;
    /* screenshotPrefix would exist as a directory */
    return path.join(global.screenshotPrefix,
        `${global.currentURLlabel}-${global.lastScreenTime.toISOString()}.jpeg`);
}

async function consoleLogParser(page, message) {
    /* this function is primarly meant to collect the public key,
     * but it is also an indirect, pseudo-efficent way to communicate
     * between puppeteer evaluated selectors and action we had to do */
    const consoleline = message.text();
    if( global.publicKeySpot === null && consoleline.match(/publicKey/) ) {
        const material = JSON.parse(consoleline);
        global.publicKeySpot = material.response.publicKey;
    }
    if(consoleline.match(scrnshtrgxp)) {
        const fdestname = getScreenshotFilename();
        // if the screenshot are less than 5 seconds close, the function
        // above would return null, so we don't take it.
        if(fdestname) {
            screendebug("Taking screenshot in [%s]", fdestname)
            await page.screenshot({ path: fdestname,
                type: 'jpeg',
                fullPage: nconf.get('fullpage') || false });
        }
    }
};

async function beforeDirectives(page, profinfo) {
    page.on('console', await _.partial(consoleLogParser, page));
    page.on('pageerror', message => bconsError('Error %s', message));
    page.on('requestfailed', request => bconsError(`Requestfail: ${request.failure().errorText} ${request.url()}`));
}


async function beforeLoad(page, directive) {
    global.currentURLlabel = directive.urltag;
}

async function completed() {
    return global.publicKeySpot;
}

async function beforeWait(page, directive) {
    // debug("Nothing in beforeWait but might be screencapture or ad checking");
}

async function afterWait(page, directive) {
    // const innerWidth = await page.evaluate(_ => { return window.innerWidth });
    // const innerHeight = await page.evaluate(_ => { return window.innerHeight });
}

module.exports = {
    beforeLoad,
    beforeWait,
    afterWait,
    beforeDirectives,
    completed,
    DOMAIN_NAME: 'tiktok.com',
}
