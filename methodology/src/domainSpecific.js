const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('guardoni:youtube');
const bcons = require('debug')('guardoni:console');
const path = require('path');
const fs = require('fs');

async function beforeWait(page, directive) {
page
    .on('console', function(message) {
        if(message.text().match(/publicKey/)) {
            if(directive.experiment) {
                const appendl = path.join("logs", "incremental-" + directive.experiment + ".json");
                const explog = path.join("logs", directive.experiment + ".json");
                let msg = null;
                try {
                    msg = JSON.parse(message.text().replace(/\n/g, '').replace(/.*{/, '{').replace(/}.*/, '}') );
                } catch(error) {
                    // if this error happens it is because the regexp is failing in cleaning the input 
                    // from browser extension and therefore JSON parsing fails. the Text expected is:
                    // message.text()
                    // "app.js gets {\n  \"active\": true,\n  \"publicKey\": \"6gVBjX7CrA7jTCxowexugCKQtt7\",\n  \"secretKey\": \"3KZhpyV6qECzaeTDJKdJCzmT21GSFFBThsvh3V6ZLAs\",\n  \"ux\": false\n} from localLookup"
                    console.log("ERROR!", error);
                    console.log(message.text());
                    process.exit(1);
                }
                const payload = {
                    publicKey: msg.publicKey,
                    day: moment().format("DD MMMM YYYY"),
                    when: moment().toISOString(),
                }
                fs.writeFileSync(appendl, JSON.stringify(payload) + "\n", {
                    encoding: "utf-8", flag: "a+" });
                fs.writeFileSync(explog, JSON.stringify(payload), {
                    encoding: "utf-8", flag: "w+" });
                console.log("Append [", appendl, "] Saved [" + explog + "]");
            } else {
                console.log("publicKey spotted and experiment not configured:", message.text());
            }
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
    if(directive.url.match(/\/watch\?v=/)) {
        const state = await getYTstatus(page);
        debug("afterWait status found to be: %s", state.name);
        await interactWithYT(page, directive, "playing");
    } else {
        debug("We don't know what you're doing on %s but you're free to do it!", directive.url);
    }
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
        await page.waitFor(600);
        state = await getYTstatus(page);
    } else
        debug("Not pressing space as the video is in state %s", state.name);

    const isError = await page.$('yt-player-error-message-renderer');
    if(!_.isNull(isError)) {
        console.log("Youtube video error!");
        return;
    }

    debug("Entering watching loop (state %s)", state.name);
    const specialwatch = _.isUndefined(directive.watchFor) ? 
        DEFAULT_WATCH_TIME : directive.watchFor;
    // here is managed the special condition directive.watchFor == "end"
    if(specialwatch == "end") {
        debug("This video would be watched till the end");
        for(checktime of _.times(DEFAULT_MAX_TIME / PERIODIC_CHECK_ms)) {
            await page.waitFor(PERIODIC_CHECK_ms);
            let newst = await getYTstatus(page);

            if(newst.name == "unstarted") {
                debug("Check n# %d — Forcing to start? (should not be necessary!)", checktime);
                await newst.player.press("Space");
            } else if(newst.name == "ended" || newst.name == "paused") {
                console.log("Video status [%s] at check n#%d — closing loop", newst.name, checktime);
                break;
            } else if(newst.name != "playing")
                debug("While video gets reprooduced (#%d check) the state is [%s]", newst.name);
        }
    } else if(_.isInteger(specialwatch)) {
        console.log("watching video for the specified time of:", specialwatch, "milliseconds")
        await page.waitFor(specialwatch);
        console.log("finished special watchining time of:", specialwatch, "milliseconds");
    } else {
        console.log("Error: waitFor is not 'end' and it is not a number", specialwatch);
        process.exit(1);
    }
}

module.exports= {
    beforeWait,
    afterWait,
    interactWithYT,
    getYTstatus,
}
