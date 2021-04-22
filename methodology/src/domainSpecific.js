const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('guardoni:youtube');
const bcons = require('debug')('guardoni:console');
const path = require('path');

async function beforeWait(page, directive) {

    page
        .on('console', function(message) {
            bcons(`${message.text()}`);
            if(message.text().match(/publicKey/)) {
                console.log("publicKey spotted:", message.text());
            }
        })
        .on('pageerror', ({ message }) => debug('error' + message)) /*
        .on('response', response =>
            debug(`response: ${response.status()} ${response.url()}`))
        .on('requestfailed', request =>
            debug(`requestfail: ${request.failure().errorText} ${request.url()}`)); */

    if(directive.url.match(/\/watch\?v=/)) {
        const state = await getYTstatus(page);
        debug("beforeWait status found to be:", state.name);
        await interactWithYT(page, directive, "playing");
    } else {
        debug("We don't know what you're doing on %s but you're free to do it!", directive.url);
    }
}

async function afterWait(page, directive) {
    // const innerWidth = await page.evaluate(_ => { return window.innerWidth });
    // const innerHeight = await page.evaluate(_ => { return window.innerHeight });
    const state = await getYTstatus(page);
    debug("afterWait status found to be:", state.name);
    /*
    if(directive.nodump !== true) {
        const screendumpf = moment().format("YYYYMMDD-HHmm") + '-' + directive.name + '-' + directive.profile + '.png';
        const fullpath = path.join('tmp', screendumpf);
        debug("afterWait, collecting screenshot in %s", fullpath);
        await state.player.screenshot({ path: fullpath });
    } */
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
    debug("Current video state is: %s", condition[st]);

    return { name: condition[st],
             player: yt
    };
}

async function interactWithYT(page, directive, wantedState) {

    const DEFAULT_MAX_TIME = 1000 * 60 * 10; // 10 minutes
    const DEFAULT_WATCH_TIME = 9000;

    // consenso all'inizio
    // non voglio loggarmi (24 ore)
    // non voglio la prova gratuita (random)

    const state = await getYTstatus(page);
    if(state.name != wantedState) {
        debug("State switching necessary (now %s, wanted %s)", state.name, wantedState)
        // not really possible guarantee a full mapping of condition. this
        // function only deploy a space press to let video start
    }
    if(state.name == "unstarted") {
        const res = await state.player.press("Space");
        await page.waitFor(600);
        const nowst = await getYTstatus(page);
        debug("Pressed space: from -1, now the state is %d [%s]",
            nowst.name,
            directive.watchFor === "end"
            ? "special watch till the end" :
            "duration " + directive.watchFor);
    } else {
        console.log("Not pressing space as the video is already going");
    }

    const isError = await page.$('yt-player-error-message-renderer');
    if(!_.isNull(isError)) {
        console.log("Youtube video error!");
        return;
    }

    debug("Loaded video (state %s)", state.name);
    const specialwatch = _.isUndefined(directive.watchFor) ? 
        DEFAULT_WATCH_TIME : directive.watchFor;
    // here is managed the special condition directive.watchFor == "end"
    if(specialwatch === "end") {
        debug("specialwatch till the end");
        /* watch until the movie_player is 'end' */
        for(checktime of _.times(DEFAULT_MAX_TIME / 5000)) {
            await page.waitFor(5000);
            const newst = await getYTstatus(page);
            debug("Check number %d, player state: %s = %s", checktime, st, condition[st]);
            if(newst.name == "ended") {
                console.log("Video play ended!");
                return;
            }
            if(newst.name == "unstarted") {
                debug("Forcing to start? hoping there wasn't any mess with ad");
                await newst.player.press("Space");
            }
        }
        console.log("Video play for too long, the maximumg playtime is reached", DEFAULT_MAX_TIME);
    } else if(_.isInteger(specialwatch)) {
        console.log("watching video for the specified time of:", specialwatch, "milliseconds")
        await page.waitFor(specialwatch);
        console.log("finished special watchining time of:", specialwatch, "milliseconds");
    } else {
        console.log(specialwatch, "Error: not 'end' and not a number");
        process.exit(1);
    }
}

module.exports= {
    beforeWait,
    afterWait,
    interactWithYT,
    getYTstatus,
}
