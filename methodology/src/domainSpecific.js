const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('guardoni:youtube');
const bcons = require('debug')('guardoni:console');
const path = require('path');
const fs = require('fs');
const nconf = require('nconf');
const fetch = require('node-fetch');


async function markingExperiment(experimentName, profile, directives) {
    /* in sequence:
    - build the URL to record the experiment 
    - create a profile log and an experiment log 
    - update profile log if exists 
    - send a mixture of the information to the server */
  let server = nconf.get('backend') ? nconf.get('backend') : 'https://youtube.tracking.exposed';
  if(_.endsWith(server, '/')) server = server.replace(/\/$/, '');
  const uri = `${server}/api/v2/experiment`;
  const profilefile = path.join("executions", profile + ".json");
  let sessionCounter = 0;
  try {
    const profinfo = JSON.parse(fs.readFileSync(profilefile, 'utf-8'));
    sessionCounter = profinfo.counter +=1;
    profinfo.usages.push(new Date());
    debug("Found profile log %s, this is sessionCounter %d", profilefile, sessionCounter)
    fs.writeFileSync(profilefile, JSON.stringify(profinfo), {
      flag: 'w+', encoding: 'utf-8'
    });
  } catch(error) {
    debug("Catch error %s, creation of new profile log (%s)",
      error.message, profilefile);
    const profinfo = {
      usages: [ new Date() ],
      counter: 1
    }
    fs.writeFileSync(profilefile, JSON.stringify(profinfo), {
      flag: 'w+', encoding: 'utf-8'
    });
    sessionCounter = 1;
  }
  try {
    const keylog = path.join("experiments", [experimentName, profile].join('-') + ".json");
    const explog = JSON.parse(fs.readFileSync(keylog, 'utf-8'))
    const payload = _.reduce(directives, function(memo, d) {
      memo.videos.push(_.pick(d, ['url', 'name', 'watchFor']));
      return memo;
    }, {
      sessionCounter,
      experimentName,
      profile,
      videos: [],
      publicKey: explog.publicKey,
      when: explog.when
    });
    debug("ready to push %s %s", uri, payload);
    const commit = await fetch(uri, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      }
    });
    const result = await commit.json();
    if(!result.ok) 
      debug("Server error? %s", JSON.stringify(result, undefined, 2));
    console.log("Check results https://youtube.tracking.exposed/experiment2/#" + experimentName);
  } catch(error) {
      console.log("Errro", error.message);
  }
}

async function savekey(message, experimentName, directives, profile) {
    const keylog = path.join("experiments", [ experimentName, profile ].join("-") + ".json");
    let parsedcnsl = null;
    try {
        parsedcnsl = JSON.parse(message.text().replace(/\n/g, '').replace(/.*{/, '{').replace(/}.*/, '}') );
        debug("savelog %s %s", parsedcnsl, experimentName);
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
        directives,
        profile,
        publicKey: parsedcnsl.publicKey,
        day: moment().format("DD MMMM YYYY"),
        when: moment().toISOString(),
    }
    fs.writeFileSync(keylog, JSON.stringify(payload), {
        encoding: "utf-8", flag: "w+" });
    console.log("written keylog", keylog);
}

let sentOnce = false;
async function lookForPubkey(experimentName, profile, directives, message) {
    /* only the first time the key is seen, the full experiment plan is sent */
    if(sentOnce)
        return;
    if(message.text().match(/publicKey/)) {
        await savekey(message, experimentName, directives, profile);
        await markingExperiment(experimentName, profile, directives);
        sentOnce = true;
    }
};

async function beforeDirectives(page, experiment, profile, directives) {
debug("Listening in console...");
if(experiment)
    page.on('console', await _.partial(lookForPubkey, experiment, profile, directives));
else
    page.on('console', function(message) { debug("%s", message.text())});
page
    .on('pageerror', ({ message }) => debug('error' + message)) /*
    .on('response', response =>
        debug(`response: ${response.status()} ${response.url()}`))
    .on('requestfailed', request =>
        debug(`requestfail: ${request.failure().errorText} ${request.url()}`)); */
}

async function beforeWait(page, directive) {
    debug("Nothing in beforeWait but might be screencapture or ad checking");
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
    beforeDirectives,
    interactWithYT,
    getYTstatus,
}
