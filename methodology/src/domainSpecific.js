const _ = require('lodash');
const debug = require('debug')('methodology:youtube');
const bcons = require('debug')('browser:console');

async function beforeWait(page, directive) {

    page
        .on('console', function(message) {
            // bcons(`${message.text()}`);
            if(message.text().match(/publicKey/)) {
                console.log("publicKey spotted:", message.text());
            }
        })
        .on('pageerror', ({ message }) => debug('error' + message)) /*
        .on('response', response =>
            debug(`response: ${response.status()} ${response.url()}`))
        .on('requestfailed', request =>
            debug(`requestfail: ${request.failure().errorText} ${request.url()}`)); */
}

async function afterWait(page, directive) {

    // const innerWidth = await page.evaluate(_ => { return window.innerWidth });
    // const innerHeight = await page.evaluate(_ => { return window.innerHeight });

    const DEFAULT_MAX_TIME = 1000 * 60 * 10; // 10 minutes
    const DEFAULT_WATCH_TIME = 9000;

    if(directive.url.match(/\/watch\?v=/)) {
        debug("Guessed video watchin, Inspecting movie_player, considering 'specialwatch'");
        const condition = {
            "-1": "unstarted",
            "0": "ended",
            "1": "playing",
            "2": "paused",
            "3": "buffering",
            "5": "video cued",
        }

        await page.waitForSelector("#movie_player");
        const yt = await page.evaluateHandle(() => document.querySelector('#movie_player'));
        const ele = await yt.asElement()
        // const fs = await ele.evaluate(function(e) { return e.toggleFullscreen() })
        const st = await ele.evaluate(function(e) { return e.getPlayerState() })
        // const scr = await yt.screenshot({ path: "screendump.png"});
        // return bitmap
        debug("Loaded video, state is %s = %s", st, condition[st.toString()]);
        const specialwatch = _.isUndefined(directive.specialwatch) ? 
            DEFAULT_WATCH_TIME : directive.specialwatch;

        // gestire se directive.specialwatch == "end"
        if(condition[st] == "unstarted") {
            const res = await yt.press("Space");
            await page.waitFor(500);
            const andafter = await ele.evaluate(function(e) { return e.getPlayerState() })
            debug("Pressed space: from -1, now the state is %d, special watch %s", andafter, specialwatch);
        } else {
            console.log("Not pressing space as the video is already going: special-video-wait now, default 10s.");
        }

        const isError = await page.$('yt-player-error-message-renderer');
        if(!_.isNull(isError)) {
            console.log("Youtube video error!");
            return;
        }

        if(specialwatch === "end") {
            debug("specialwatch till the end");
            /* watch until the movie_player is 'end' */
            for(checktime of _.times(DEFAULT_MAX_TIME / 5000)) {
                await page.waitFor(5000);
                const yt = await page.evaluateHandle(() => document.querySelector('#movie_player'));
                const ele = await yt.asElement()
                const st = await ele.evaluate(function(e) { return e.getPlayerState() });
                debug("Check number %d, player state: %s = %s", checktime, st, condition[st]);
                if(st == "0") { // ended
                    console.log("Video play ended!");
                    return;
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
}

module.exports= {
    beforeWait,
    afterWait,
}