const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('guardoni:youtube');
const logreqst = require('debug')('guardoni:requests');
const screendebug = require('debug')('guardoni:screenshots');
const bconsError = require('debug')('guardoni:error');
const path = require('path');
const url = require('url');
const fs = require('fs');
const nconf = require('nconf');

debug.enabled = true;
logreqst.enabled = true;

const SCREENSHOT_MARKER = "SCREENSHOTMARKER";
const scrnshtrgxp = new RegExp(SCREENSHOT_MARKER);

global.lastScreenTime = moment().subtract(4, 'seconds');
global.currentURLlabel = null;
global.screenshotPrefix = null;
global.interval = null;

function getScreenshotFilename() {
    /* this function return null if no screenshot has to be taken,
     * and the criteria is to take max one screen every 5 seconds */
    const now = moment();
    if(moment.duration(now - global.lastScreenTime).asSeconds() < 5)
        return null;

    global.lastScreenTime = now;
    /* screenshotPrefix would exist as a directory */
    return path.join(global.screenshotPrefix,
        `${global.currentURLlabel}-${global.lastScreenTime.format("YYYY-MM-DD-HH-mm-SS")}.jpeg`);
}

async function consoleLogParser(page, message) {
    /* this function is primarly meant to collect the public key,
     * but it is also an indirect, pseudo-efficent way to communicate
     * between puppeteer evaluated selectors and action we had to do */
    const consoleline = message.text();
    if(consoleline.match(scrnshtrgxp)) {
        const fdestname = getScreenshotFilename();
        // if the screenshot are less than 5 seconds close, the function
        // above would return null, so we don't take it.
        if(fdestname) {
            screendebug("Taking screenshot in [%s]", fdestname)
            await page.screenshot({ path: fdestname, type: 'jpeg', fullPage: true });
        }
    }
};

/* these advertising selectors comes from browser extension,
 * and they should be centralized in a piece of updated code */
const advSelectors = [
    '.video-ads.ytp-ad-module',
    '.ytp-ad-player-overlay',
    '.ytp-ad-player-overlay-instream-info',
    'ytd-promoted-sparkles-web-renderer',
    '.ytd-action-companion-ad-renderer',
    '.sparkles-light-cta',
    '[data-google-av-cxn]',
    '#ad-badge',
    'ytd-banner-promo-renderer',
    '.ytd-search-refinement-card-renderer',
    '.ytd-promoted-sparkles-text-search-renderer'
];

async function beforeDirectives(page, profinfo) {
    page.on('console', await _.partial(consoleLogParser, page));
    page.on('pageerror', message => bconsError('Error %s', message));
    page.on('requestfailed', request => bconsError(`Requestfail: ${request.failure().errorText} ${request.url()}`));

    // await page.setRequestInterception(true);
    if(!!nconf.get('3rd')) {
        page.on('request', await _.partial(manageRequest, profinfo));
        setInterval(print3rdParties, 60 * 1000);
    }

    const advdump = nconf.get('advdump');
    if(!advdump)
        return;

    /* this is to monitor presence of special selectors that
     * should trigger screencapture */
    if(global.interval)
        clearInterval(global.interval);

    global.screenshotPrefix = path.join(advdump, `${profinfo.profileName}..${profinfo.execount}`);

    try {
        fs.mkdirSync(global.screenshotPrefix)
    } catch(error) { }

    global.interval = setInterval(function() {
        _.each(advSelectors, function(selector) {
            try {
            /* variables from node need to be passed this way to pptr */
                page.evaluate( (selector, SCREENSHOT_MARKER) => {
                    const x = document.querySelector(selector);
                    if(x)
                        console.log(SCREENSHOT_MARKER, selector);
                }, selector, SCREENSHOT_MARKER);
            } catch(error) {}
        });
    }, 5000);
}

/* this is the variable we populate of statistics
 * on third parties, and every minute, it is printed on terminal */
const thirdParties = {};
/* and this is the file where logging happen */
let reqlogfilename;

function manageThirdParty(profinfo, reqpptr) {
    const up = url.parse(reqpptr.url());
    const full3rdparty = {
        method: reqpptr.method(),
        host: up.host,
        pathname: up.pathname,
        search: up.search,
        type: reqpptr.resourceType(),
        when: new Date()
    };
    if(full3rdparty.method != 'GET')
        full3rdparty.postData = reqpptr.postData();

    reqlogfilename = path.join(
        'profiles',
        profinfo.profileName,
        'requestlog.json'
    );
    fs.appendFileSync(
        reqlogfilename,
        JSON.stringify(full3rdparty) + "\n"
    );
    if(up.host !== 'www.youtube.com') {
        if(thirdParties[up.host])
            thirdParties[up.host] = 1;
        else
            thirdParties[up.host] += 1;
    }
}

function manageRequest(profinfo, reqpptr) {
    try {
        manageThirdParty(profinfo, reqpptr);
    } catch(error) {
        debug("Error in manageRequest function: %s", error.message);
    }
}

function print3rdParties() {
    logreqst("Logged third parties connections in [%s] to %o",
        reqlogfilename, thirdParties);
}

async function beforeLoad(page, directive) {
    global.currentURLlabel = directive.urltag;
}

async function beforeWait(page, directive) {
    // debug("Nothing in beforeWait but might be screencapture or ad checking");
}

async function afterWait(page, directive) {
    // const innerWidth = await page.evaluate(_ => { return window.innerWidth });
    // const innerHeight = await page.evaluate(_ => { return window.innerHeight });
    let hasPlayer = false;
    if(directive.url.match(/\/watch\?v=/)) {
        const state = await getYTstatus(page);
        debug("afterWait status found to be: %s", state.name);
        await interactWithYT(page, directive, "playing");
        hasPlayer = true;
    }

    if(directive.screenshot) {
        const screendumpf = moment().format("YYYYMMDD-HHmm") + '-' + directive.name + '.png';
        const fullpath = path.join(directive.profile, screendumpf);
        debug("afterWait: collecting screenshot in %s", fullpath);

        if(hasPlayer)
            await state.player.screenshot({ path: fullpath });
        else
            await page.screenshot({
                path: screenshotname,
                fullPage: true
            });
    }

}
const condition = {
    "-1": "unstarted",
    "0": "ended",
    "1": "playing",
    "2": "paused",
    "3": "buffering",
    "5": "video cued",
};

async function getYTstatus(page) {

    await page.waitForSelector("#movie_player");
    const yt = await page.evaluateHandle(() => document.querySelector('#movie_player'));
    const ele = await yt.asElement()
    const st = await ele.evaluate(function(e) {
        return e.getPlayerState();
    });
    const name = condition[st] ? condition[st] : "unmanaged-" + st;
    return { name,
             player: yt
    };
}

async function interactWithYT(page, directive, wantedState) {

    const DEFAULT_MAX_TIME = 1000 * 60 * 10; // 10 minutes
    const DEFAULT_WATCH_TIME = 9000;
    const PERIODIC_CHECK_ms = 3000;

    // consenso all'inizio
    // non voglio loggarmi (24 ore)
    // non voglio la prova gratuita (random)

    let state = await getYTstatus(page);
    if(state.name != wantedState) {
        debug("State switching necessary (now %s, wanted %s)", state.name, wantedState)
        // not really possible guarantee a full mapping of condition. this
        // function only deploy a space press to let video start
    }
    if(state.name == "unstarted") {
        const res = await state.player.press("Space");
        await page.waitForTimeout(600);
        state = await getYTstatus(page);
    } else
        debug("DO NOT press [space] please, as the video is in state [%s]", state.name);

    const isError = await page.$('yt-player-error-message-renderer');
    if(!_.isNull(isError)) {
        console.log("Youtube video error!");
        return;
    }

    debug("Entering watching loop (state %s)", state.name);
    const specialwatch = _.isUndefined(directive.watchFor) ? 
        "end": directive.watchFor;
    // here is managed the special condition directive.watchFor == "end"
    if(specialwatch == "end") {
        console.log(directive.url, 
            "This video would be watched till the end");

        for(checktime of _.times(DEFAULT_MAX_TIME / PERIODIC_CHECK_ms)) {
            await page.waitForTimeout(PERIODIC_CHECK_ms);
            let newst = await getYTstatus(page);

            if(newst.name == "unstarted") {
                debug("Check n# %d — Forcing to start? (should not be necessary!)", checktime);
                await newst.player.press("Space");
            } else if(newst.name == "ended" || newst.name == "paused") {
                debug("Video status [%s] at check n#%d — closing loop", newst.name, checktime);
                break;
            } else if(newst.name != "playing")
                debug("While video gets reproduced (#%d check) the state is [%s]", checktime, newst.name);
        }
    } else if(_.isInteger(specialwatch)) {
        console.log(directive.url,
            "Watching video for the specified time of:",
            specialwatch, "milliseconds")
        await page.waitForTimeout(specialwatch);
        debug("Finished special watchining time of:", specialwatch, "milliseconds");
    } else {
        console.log("Error: invalid waitFor value [%s]", directive.watchFor);
        process.exit(1);
    }
}

module.exports = {
    beforeLoad,
    beforeWait,
    afterWait,
    beforeDirectives,
    interactWithYT,
    getYTstatus,
    DOMAIN_NAME: 'youtube.com',
}
