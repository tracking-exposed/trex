const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('guardoni:youtube');
const logreqst = require('debug')('guardoni:requests');
const bconsError = require('debug')('guardoni:error');
const keyprint = require('debug')('guardoni:key');
const path = require('path');
const url = require('url');
const fs = require('fs');

debug.enabled = true;
keyprint.enabled = true;
logreqst.enabled = true;

let sentOnce = false;
function lookForPubkey(message) {
    /* only the first time the key is seen, the full experiment plan is sent */
    if(sentOnce)
        return;
    if(message.text().match(/publicKey/)) {
        const parsedcnsl = JSON.parse(message.text().replace(/\n/g, '').replace(/.*{/, '{').replace(/}.*/, '}') );
        const publicKey = parsedcnsl.publicKey;
        keyprint("Publickey: %s", publicKey);
        sentOnce = true;
    }
};

let loggedextreqs = 0;
async function beforeDirectives(page, profinfo) {
    page.on('console', lookForPubkey);
    page.on('pageerror', message => bconsError('Error %s', message));
    page.on('requestfailed', request => bconsError(`Requestfail: ${request.failure().errorText} ${request.url()}`));
    // await page.setRequestInterception(true);
    page.on('request', await _.partial(manageRequest, profinfo));
}

async function manageRequest(reqpptr) {
    try {
    const up = url.parse(reqpptr.url());
    debugger;
    const x  =await reqpptr.resourceType()
    console.log(reqpptr.resourceType(), up.pathname)
    const full3rdparty = {
        // method: request.method(),
        host: up.host,
        pathname: up.pathname,
        search: up.search,
        type: reqpptr.resourceType(),
        when: new Date()
    };
    if(full3rdparty.method != 'GET')
        full3rdparty.postData = request.postData();

    const reqlogfilename = path.join(
        'profiles',
        profinfo.profileName,
        'requestlog.json'
    );
    fs.appendFileSync(
        reqlogfilename,
        JSON.stringify(full3rdparty)
    );
    loggedextreqs++;
    logreqst("Logged external request to %s", full3rdparty.host)
    } catch(error) {
        debug("Error in manageRequest function: %s", error.message);
    }
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

module.exports= {
    beforeWait,
    afterWait,
    beforeDirectives,
    interactWithYT,
    getYTstatus,
    loggedextreqs,
}
