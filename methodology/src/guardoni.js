#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('guardoni:yt-cli');
const puppeteer = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const fs = require('fs');
const path = require('path');
const nconf = require('nconf');
const moment = require('moment');
const fetch = require('node-fetch');
const execSync = require('child_process').execSync;
const parse = require('csv-parse/lib/sync');

const COMMANDJSONEXAMPLE = "https://youtube.tracking.exposed/json/automation-example.json";
const EXTENSION_WITH_OPT_IN_ALREADY_CHECKED='https://github.com/tracking-exposed/yttrex/releases/download/1.4.99/extension.zip';

nconf.argv().env();

defaultAfter = async function(page, directive) {
  debug("afterWait function is not implemented");
}
defaultBefore = async function(page, directive) {
  debug("beforeWait function is not implemented");
}
defaultInit = async function(page, directive) {
  debug("beforeDirective function is not implemented");
}

async function keypress() {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}

async function allowResearcherSomeTimeToSetupTheBrowser() {
  console.log("\n\n.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:.");
  console.log("Creating profile", nconf.get('evidencetag'));
  console.log("You should see a chrome browser (with yttrex installed)")
  console.log("\nPLEASE in that window, open youtube.com and accept the cookie processing.");
  console.log("ONLY AFTER, press ANY KEY here. It will start the collection");
  console.log("\n(without accepting the cookie banner the test will fail and you have to remove the directory with your evidencetag, to restart.)");
  console.log("\nnext time you'll use the same evidencetag, this step would not appear, as long as you keep the directory.");
  console.log('\n~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~');
  await keypress();
}

function downloadExtension(zipFileP) {
  debug("Executing curl and unzip (if these binary aren't present in your system please mail support at tracking dot exposed because you might have worst problems)");
  execSync('curl -L ' + EXTENSION_WITH_OPT_IN_ALREADY_CHECKED + " -o " + zipFileP);
  execSync('unzip ' + zipFileP + " -d extension");
}

function getChromePath() {
  // this function check for standard chrome executabled path and 
  // return it. If not found, raise an error
  const knownPaths = [
    "/usr/bin/google-chrome",
    "/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];

  const chromePath = _.find(knownPaths, function(p) {
    return fs.existsSync(p);
  })
  if(!chromePath) {
    console.log("Tried to guess your Chrome executable and wasn't found");
    console.log("Solutions: Install Google Chrome in your system or contact the developers");
    process.exit(1);
  }
  return chromePath;
}

/*
3. guardoni uses the same experiment API to mark contribution with 'evidencetag'
4. it would then access to the directive API, and by using the experimentId, will then perform the searches as instructed.
*/

async function manageChiaroscuro() {

  const csvfile = nconf.get('csv');
  const evidencetag = nconf.get('evidencetag');

  if(!evidencetag)
    return console.log("Error: you need a --evidencetag to mark you collection");

  let records;
  try {
    const input = fs.readFileSync(csvfile, 'utf-8');
    records = parse(input, {
      columns: true,
      skip_empty_lines: true
    });
    debug("Read input from file %s (%d bytes) %d records",
      csvfile, input.length, records.length);
  } catch(error) {
    return console.log("Error: invalid CSV file from options --csv ", error.message);
  }

  // TODO validate records

  let server = nconf.get('backend') ? nconf.get('backend') : 'https://youtube.tracking.exposed';
  if(_.endsWith(server, '/')) server = server.replace(/\/$/, '');
  const registeruri = `${server}/api/v3/chiaroscuro`;
  // implemented in backend/routes/chiaroscuro.js
  const apipayload = {
    parsedCSV: records,
    evidencetag
  };

  let experimentId = null;
  try {
    const commit = await fetch(registeruri, {
      method: 'POST',
      body: JSON.stringify(apipayload),
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    });
    const experimentInfo = await commit.json(); 
    debug("expinfo %j", experimentInfo);
    if(experimentInfo.error)
      return console.log("Error received from the server: ", experimentInfo.message);
    experimentId = experimentInfo.experimentId;
  } catch(error) {
    return console.log("Failure in talking with API: ", error.message);
  }

  debug("Your experimentId is %s", experimentId);

  const direcurl = `${server}/api/v3/chiaroscuro/${experimentId}/${evidencetag}`;
  let directives = await pullDirectives(direcurl);
  directives = enhanceDirectives(experimentId, directives);

  let profile = nconf.get('profile');
  if(!profile) {
    profile = evidencetag ;
    debug("Executing browser, profile is = to evidencetag %s", profile);
  } else
    debug("Executing browser for profile %s (evidencetag %s)", profile, evidencetag);

  const browser = await dispatchBrowser(true, profile);
  await guardoniExecution(experimentId, directives, browser);
}

async function pullDirectives(sourceUrl) {
  let directives = null;
  try {
    if(_.startsWith(sourceUrl, 'http')) {
      const response = await fetch(sourceUrl);
      if(response.status !== 200) {
        console.log("Error in fetching directives from URL", response.status);
        process.exit(1);
      }
      directives = await response.json();
    } else {
      directives = JSON.parse(fs.readFileSync(sourceUrl, 'utf-8'));
    }
    if(!directives.length) {
      console.log("URL/file do not include any directive in expected format");
      console.log("Check the example with --source ", COMMANDJSONEXAMPLE);
      process.exit(1);
    }
    return directives;
  } catch (error) {
    console.log("Error in retriving directive URL: " + error.message);
    // console.log(error.response.body);
    process.exit(1);
  }
}

function enhanceDirectives(experiment, directives, profile) {
  return  _.map(directives, function(d) {
    const watchForSwp = d.watchFor;
    const loadForSwp = d.loadFor;

    d.loadFor = timeconv(loadForSwp, 3000);
    d.watchFor = timeconv(watchForSwp, 20000);
    /* debug("Time converstion results: loadFor %s watchFor %s", d.loadFor, d.watchFor); */

    d.profile = profile;
    if(experiment)
      d.experiment = experiment;
    return d;
  });
}


async function readExperiment(profile) {

  if(!profile)
    profile = `guardoni-${moment().format("YYYY-MM-DD")}`;

  let experiment = null;
  const browser = await dispatchBrowser(false, profile);

  try {
    const page = (await browser.pages())[0];
    _.tail(await browser.pages()).forEach(async function(opage) {
      debug("Closing a tab that shouldn't be there!");
      await opage.close();
    });

    const introPage = path.join(process.cwd(), 'static', 'index.html');
    await page.goto(introPage);

    const poller = setInterval(async function() {
      const inputs = await page.$$eval("input[type=radio]", function(elist) {
        return elist.map(function(e) {
          if(e.checked) {
            return { experiment: e.getAttribute('experimentId') };
          }
        })
      })
      const selected = _.compact(inputs);
      if(selected.length) {
        experiment = selected[0].experiment;
        await page.$eval("#nextstep", function(e) {
          e.removeAttribute('disabled');
        });
      }

      if(experiment) {
        page.goto("https://www.youtube.com");
        clearInterval(poller);
      }

    }, 1000);

    const seconds = 30;
    console.log(`You've ${seconds} seconds to select your experiment and save cookies;`)
    await page.waitForTimeout(1000 * seconds);

    if(!experiment)
      clearInterval(poller);

    await browser.close();

    if(!experiment) {
      console.log("Error: you should select something!");
      process.exit(1);
    }

    sourceUrl = '/api/v2/directives/' + experiment;
    return {
      experiment,
      sourceUrl,
    }
  } catch(error) {
    debug("Browser et al error: %s", error.message);
  }
}

async function main() {

  if( nconf.get('shadowban') )
    return await manageChiaroscuro();

  let sourceUrl, profile, directives, experiment = null;

  experiment = nconf.get('experiment');
  profile = nconf.get('profile');
  sourceUrl = nconf.get('source');

  if(experiment && !profile) {
    console.log("--profile it is necessary and if you don't have one: pick up a name and this tool would assist during the creation");
    process.exit(1)
  }

  if(experiment && !sourceUrl) {
    console.log("If you set --experiment");
    console.log("You might add --source " + COMMANDJSONEXAMPLE);
    console.log("Via --source you can specify an URL <or> a filepath")
    console.log("Check on github.com/tracking-exposed/yttrex directive protocol");
    console.log("This condition causes the usage of directive protocol");
    sourceUrl = "/api/v3/directives/videos/" + experiment;
  }

  if(!experiment) {
    debug("Dispatch browser for local questioning");
    let restrictedSettings = await readExperiment(profile);
    // this implicitly has also absolved the delayForSearcher call.
    debug("experiment read via local page: %j", restrictedSettings);
    experiment = restrictedSettings.experiment;
    sourceUrl = restrictedSettings.sourceUrl;
  }

  debug("Profile %s, experimentId %s pulling directive from %s",
    profile, experiment, sourceUrl);

  directives = await pullDirectives(sourceUrl);
  debug("directives loaded: %j", _.map(directives, 'name'));
  /* enrich directives with profile and experiment name */
  directives = enhanceDirectives(experiment, directives);
  /* ^^^^ remove and supply by API ? */

  /* TODO INJECT DIRECTIVES + EXPERIMENT INTO THE EXTENSION */
  const browser = await dispatchBrowser(experiment, directives, profile);
  
  if(browser.newProfile)
    await allowResearcherSomeTimeToSetupTheBrowser();

  await guardoniExecution(experiment, directives, browser);
}

async function dispatchBrowser(headless, profile) {

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension'));
  const manifest = path.resolve(path.join(cwd, 'extension', 'manifest.json'));
  if(!fs.existsSync(manifest)) {
    console.log('Manifest in ' + dist + ' not found, the script now would download & unpack');
    const tmpzipf = path.resolve(path.join(cwd, 'extension', 'tmpzipf.zip'));
    console.log("Using " + tmpzipf + " as temporary file");
    downloadExtension(tmpzipf);
  }

  let newProfile = false;
  let udd = path.resolve(path.join('profiles', profile));
  if(!fs.existsSync(udd)) {
    console.log("--profile name hasn't an associated directory: " + udd);
    // console.log(localbrowser," --user-data-dir=profiles/path to initialize a new profile");
    // process.exit(1)
    try {
      fs.mkdirSync(udd);
    } catch(error) {
      udd = profile;
      fs.mkdirSync(udd);
    }
    newProfile = true;
  }

  const chromePath = getChromePath();

  let browser = null;
  try {
    puppeteer.use(pluginStealth());
    browser = await puppeteer.launch({
        headless,
        userDataDir: udd,
        executablePath: chromePath,
        args: ["--no-sandbox",
          "--disabled-setuid-sandbox",
          "--load-extension=" + dist,
          "--disable-extensions-except=" + dist
        ],
    });

    // add this boolean to the return value as we need it in a case
    browser.newProfile = newProfile;
    return browser;

  } catch(error) {
    console.log("Error in dispatchBrowser:", error.message);
    await browser.close();
    process.exit(1);
  }
}

async function guardoniExecution(experiment, directives, browser) {

  try {
    const DS = './domainSpecific';
    let domainSpecific = null;
    try {
      domainSpecific = require(DS);
    } catch(error) {
      console.log("Not found domainSpecific!?", DS, error);
      domainSpecific = {
        beforeWait: defaultBefore,
        afterWait: defaultAfter,
        beforeDirectives: defaultInit,
      };
    }
    const page = (await browser.pages())[0];
    _.tail(await browser.pages()).forEach(async function(opage) {
      debug("Closing a tab that shouldn't be there!");
      await opage.close();
    })
    await domainSpecific.beforeDirectives(page, experiment, profile, directives);
    // the BS above should close existing open tabs except 1st
    await operateBroweser(page, directives, domainSpecific);
    console.log("Operations completed: check results at https://youtube.tracking.exposed/experiment/#" + experiment);
    await browser.close();
  } catch(error) {
    console.log("Error in operateBrowser (collection fail):", error);
    await browser.close();
    process.exit(1);
  }
  process.exit(0);
}

function timeconv(maybestr, defaultMs) {
  if(_.isInteger(maybestr) && maybestr > 100) {
    /* it is already ms */
    return maybestr;
  } else if(_.isInteger(maybestr) && maybestr < 100) {
    /* throw an error as it is unclear if you forgot the unit */
    throw new Error("Did you forget unit? " + maybestr + " milliseconds is too little!");
  } else if(_.isString(maybestr) && _.endsWith(maybestr, 's')) {
    return _.parseInt(maybestr) * 1000;
  } else if(_.isString(maybestr) && _.endsWith(maybestr, 'm')) {
    return _.parseInt(maybestr) * 1000 * 60;
  } else if(_.isString(maybestr) && maybestr == 'end') {
    return 'end';
  } else {
    return null;
  }
}

async function operateTab(page, directive, domainSpecific, timeout) {

  // TODO the 'timeout' would allow to repeat this operation with
  // different parameters. https://stackoverflow.com/questions/60051954/puppeteer-timeouterror-navigation-timeout-of-30000-ms-exceeded
  await page.goto(directive.url, { 
    waitUntil: "networkidle0",
  });
  debug("— Loading %s (for %dms)", directive.name, directive.loadFor);
  try {
    await domainSpecific.beforeWait(page, directive);
  } catch(error) {
    console.log("error in beforeWait", error.message, error.stack);
  }
  debug("Directive to URL %s, Loading delay %d", directive.url, directive.loadFor);
  await page.waitForTimeout(directive.loadFor);
  try {
    await domainSpecific.afterWait(page, directive);
  } catch(error) {
    console.log("Error in afterWait", error.message, error.stack);
  }
  debug("— Completed %s", directive.name);
}

async function operateBroweser(page, directives, domainSpecific) {
  // await page.setViewport({width: 1024, height: 768});
  for (directive of directives) {
    if(nconf.get('exclude') && directive.name == nconf.get('exclude')) {
      console.log("excluded!", directive.name);
    } else {
      try {
        await operateTab(page, directive, domainSpecific);
      } catch(error) {
        debug("operateTab in %s — error: %s", directive.name, error.message);
      }
    }
  }
}

main ();
