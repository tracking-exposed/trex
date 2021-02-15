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


    if(directive.name == 'video') {
        debug("Inspecting movie_player");
        debugger;
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
        debug("State is %d: %s", st, condition[st.toString()]);
        const specialwatch = directive.specialwatch || 10000;
        if(st == -1) {
            const res = await yt.press("Space");
            await page.waitFor(500);
            const andafter = await ele.evaluate(function(e) { return e.getPlayerState() })
            debug("Pressed space: from -1, now the state is %d, special watch %dms", andafter, specialwatch);
            await page.waitFor(specialwatch);
            console.log("finished special watchining time of", directive.specialwatch);
        } else {
            console.log("Not pressing space as the video is already going: special-video-wait now, default 10s.");
            await page.waitFor(specialwatch);
            console.log("finished special watchining time of", specialwatch);
        }
    }

}

module.exports= {
    beforeWait,
    afterWait,
}