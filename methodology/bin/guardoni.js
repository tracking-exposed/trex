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
const EXTENSION_WITH_OPT_IN_ALREADY_CHECKED='https://github.com/tracking-exposed/yttrex/releases/download/v1.8.99/yttrex-guardoni-1.8.99.zip';

const configPath = path.join("static", "settings.json");
nconf.argv().env().file(configPath);
debug.enabled = true;

const server = nconf.get('backend') ?
  ( _.endsWith(nconf.get('backend'), '/') ? 
    nconf.get('backend').replace(/\/$/, '') : nconf.get('backend') ) : 
  'https://youtube.tracking.exposed';

defaultAfter = async function() {
  debug("afterWait function is not implemented");
}
defaultBefore = async function() {
  debug("beforeWait function is not implemented");
}
defaultInit = async function() {
  debug("beforeDirective function is not implemented");
}

async function keypress() {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}

async function allowResearcherSomeTimeToSetupTheBrowser(profileName) {
  console.log("\n\n.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:.");
  console.log("Creating profile", profileName);
  console.log("You should see a chrome browser (with yttrex installed)")
  console.log("\nPLEASE in that window, open youtube.com and accept cookie banner.");
  console.log("ONLY AFTER, press ANY KEY here. It will start the collection");
  console.log("\n(If you don't accept the cookie banner the test might fail)");
  console.log("\nnext time you'll use the same profile, this step would not appear.");
  console.log('\n~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~');
  await keypress();
  console.log("\n[Received] Reproduction starts now!")
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
async function registerCSV(directiveType) {

  const csvfile = nconf.get('csv');

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
    console.log("Error: invalid CSV file from options --csv ", error.message);
    process.exit(1)
  }

  const uniqueKeys = _.sortBy(_.uniq(_.flatten(_.map(records, _.keys))), 'length');
  let euk = []; // effective unique keys
  if(directiveType === 'chiaroscuro')
    euk = _.sortBy(["videoURL", "title"], 'length');
  else if(directiveType === 'comparison')
    euk = _.sortBy(["url", "urltag", "watchFor"]);
  else
    throw new Error("Unmanaged directiveType");

  if(_.filter(uniqueKeys, function(keyavail) {
    return euk.indexOf(keyavail) === -1;
  }).length) {
    console.log("Invalid CSV key read. expected only these:", euk);
    console.log("You can find examples on https://youtube.tracking.exposed/guardoni");
    process.exit(1);
  } else {
    debug("CSV validated in [%s] format specifications",
      directiveType);
  }

  const registeruri = buildAPIurl('directives', directiveType);
  // implemented in backend/routes/directives.js
  debug("Registering CSV via %s", registeruri);

  try {
    const commit = await fetch(registeruri, {
      method: 'POST',
      body: JSON.stringify({ parsedCSV: records }),
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    });
    const experimentInfo = await commit.json(); 
    if(experimentInfo.error)
      return console.log("Error received from the server: ", experimentInfo.message);
    
    return experimentInfo;
    // contains .experimentId and .status (created|exist)

  } catch(error) {
    console.log("Failure in talking with API:", error.message);
    return null;
  }
}

/*
async function manageChiaroscuro(evidencetag, directiveType, profinfo) {
  const browser = await dispatchBrowser(true, profinfo);
  const experimentId = await registerCSV(evidencetag, directiveType);

  const direurl = buildAPIurl('directives', experimentId);
  const directives = await pullDirectives(direurl);
  await writeExperimentInfo(experimentId, profinfo, evidencetag, directiveType);

  const t = await guardoniExecution(experimentId, directives, browser);
  debug("— Guardoni execution took %s",
    moment.duration(t.end - t.start).humanize());
  await concludeExperiment(experimentId, profinfo);
  process.exit(0);
} */

async function pullDirectives(sourceUrl) {
  let directives = null;
  try {
    if (_.startsWith(sourceUrl, 'http')) {
      const response = await fetch(sourceUrl);
      if (response.status !== 200) {
        console.log("Error in fetching directives from URL", response.status);
        process.exit(1);
      }
      directives = await response.json();
    } else {
      throw new Error("A local file isn't supported anymore");
      directives = JSON.parse(fs.readFileSync(sourceUrl, 'utf-8'));
    }
    if (!directives.length) {
      console.log("URL/file do not include any directive in expected format");
      console.log("Example is --directive ", COMMANDJSONEXAMPLE);
      process.exit(1);
    }
    return directives;
  } catch (error) {
    console.log("Error in retriving directive URL: " + error.message);
    // console.log(error.response.body);
    process.exit(1);
  }
}

async function readExperiment(profinfo) {

  let page, experiment = null;
  const browser = await dispatchBrowser(false, profinfo);

  try {
    page = (await browser.pages())[0];
    _.tail(await browser.pages()).forEach(async function (opage) {
      debug("Closing a tab that shouldn't be there!");
      await opage.close();
    });

    const introPage = path.join(process.cwd(), 'static', 'index.html');
    await page.goto(introPage);
  } catch (error) {
    debug("Browser forcefully closed? %s", error.message);
    if (experiment)
      return {
        experiment,
        sourceUrl: buildAPIurl('directives', experiment),
      }
    else {
      console.log("Browser closed before experiment was selected: quitting")
      process.exit(1)
    }
  }

  const poller = setInterval(async function () {
    let inputs = [];
    try {
      inputs = await page.$$eval("input[type=radio]", function (elist) {
        return elist.map(function (e) {
          if (e.checked) {
            return { experiment: e.getAttribute('experimentId') };
          }
        })
      })
    } catch (error) {
      clearInterval(poller);
      console.log("Failure in interacting with browser, still you've to wait a few seconds. Error message:");
      console.log("\t" + error.message);
    }

    const selected = _.compact(inputs);
    if (selected.length) {
      experiment = selected[0].experiment;
      await page.$eval("#nextstep", function (e) {
        e.removeAttribute('disabled');
      });
    }

    if (experiment) {
      clearInterval(poller);
      page.waitForTimeout(900);
      page.goto("https://www.youtube.com");
    }

  }, 1600);

  const seconds = 30;
  console.log(`You've ${seconds} seconds to select your experiment and accept cookies banner on YouTube!;`)

  try {
    await page.waitForTimeout(1000 * seconds);
    if (!experiment)
      clearInterval(poller);
    await browser.close();
  } catch (error) {
    console.log("Error in browser/page control:", error.message);
    process.exit(1);
  }

  if (!experiment) {
    console.log("Error: you should has select an experiment from the browser!");
    process.exit(1);
  }

  return {
    experiment,
    sourceUrl: buildAPIurl('directives', experiment),
  }
}

function buildAPIurl(route, params) {
  if (route === 'directives' && ["chiaroscuro", "comparison"].indexOf(params) !== -1)
    return `${server}/api/v3/${route}/${params}`;
  else {
    return `${server}/api/v3/${route}/${params}`;
  }
}

function profileExecount(profile, evidencetag) {
  let data, newProfile = false;
  const udd = path.resolve(path.join('profiles', profile));
  const guardfile = path.join(udd, 'guardoni.json');
  if (!fs.existsSync(udd)) {
    console.log("--profile hasn't a directory: " + udd + "creating...");
    try {
      fs.mkdirSync(udd);
    } catch (error) {
      console.log("Unable to create directory:", error.message);
      process.exit(1)
    }
    newProfile = true;
  }

  if (!newProfile) {
    const jdata = fs.readFileSync(guardfile, 'utf-8');
    data = JSON.parse(jdata);
    debug("profile %s read %d execount", profile, data.execount);
    data.execount += 1;
    data.evidencetags.push(evidencetag);
  } else {
    data = {
      execount: 1,
      evidencetags: [evidencetag]
    }
  }

  data.newProfile = newProfile;
  data.profileName = profile;
  fs.writeFileSync(guardfile, JSON.stringify(data, undefined, 2), 'utf-8');
  debug("profile %s wrote %j", profile, data);
  return data;
}

function printHelp() {
  const helptext = `\nOptions can be set via: env , --longopts, and ${configPath} file
Three modes exists to launch Guardoni:\n

To quickly test the tool:
   --auto:\t\tYou can specify 1 (is the default) or 2.

To register an experiment:
   --csv FILENAME.csv\tdefault is --comparison, optional --shadowban

To execute a known experiment:
   --experiment <experimentId>

https://youtube.tracking.exposed/guardoni for full documentation.
 [--evidencetag, --profile, --backend are special option]
You need a reliable internet connection to ensure a flawless collection`;
  console.log(".:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:.");
  console.log(helptext);
  console.log('\n~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~');
}

async function main() {

  const auto = nconf.get('auto');
  const shadowban = nconf.get('shadowban');
  const directiveType = !!shadowban ? "chiaroscuro" : "comparison";
  let experiment = nconf.get('experiment');
  const sourceUrl = nconf.get('csv');

  if(!auto && !sourceUrl && !experiment) {
    printHelp();
    process.exit(1);
  }

  if(auto === "2") {
    debug("Selected experiment n.2 (codename: Naomi)")
    experiment = "d75f9eaf465d2cd555de65eaf61a770c82d59451";
  } else if(auto === "1" || !!nconf.get('auto')) {
    debug("Selected experiment n.1 (codename: Greta)")
    experiment = "37384a9b7dff26184cdea226ad5666ca8cbbf456";
  }

  /*
  if(directiveType == 'chiaroscuro')
    return await manageChiaroscuro(evidencetag, profinfo); */

  if (sourceUrl) {

    debug("Registering CSV %s as %s", sourceUrl, directiveType);
    const note = await registerCSV(directiveType)
    if(note && note.since)
      console.log("CSV %s, experimentId %s exists since %s",
        note.status, note.experimentId, note.since);
    else if(note && note.experimentId)
      console.log("Directive from CSV created: experimentId %s",
        note.experimentId);
    else
      console.log("CSV error in upload.");

    process.exit(1);
  }

  if(experiment && (!_.isString(experiment) || experiment.length < 20)) {
    console.log("\n--experiment awaits for an experiment ID, try it out:");
    console.log("For example: --experiment d75f9eaf465d2cd555de65eaf61a770c82d59451");
    process.exit(1);
  }

  if(sourceUrl && experiment) {
    console.log("Error: when registering a CSV, you can't specify the --experiment");
    process.exit(1);
  }

  const evidencetag = nconf.get('evidencetag') || 'none-' + _.random(0, 0xffff);
  let profile = nconf.get('profile');
  if (!profile)
    profile = nconf.get('evidencetag') ?
      evidencetag : `guardoni-${moment().format("YYYY-MM-DD")}`;
  /* if not profile, if evidencetag take it, or use a daily profile */

  debug("Configuring browser for profile %s (evidencetag %s)", profile, evidencetag);
  const profinfo = await profileExecount(profile, evidencetag);
  let directiveurl = null;

  if(experiment && !sourceUrl) {
    console.log("Resolving experiment directives with github.com/tracking-exposed/yttrex directive protocol");
    directiveurl = buildAPIurl('directives', experiment);
  }

  /*
   --- NOTE, the browser to let select experiment is temporarly suspended. To do test, 
       you can use --auto (greta) or optionally --auto 2 (naomi) 

  if(auto) {
    debug("Dispatch browser for local questioning");
    let restrictedSettings = await readExperiment(profile);
    // this implicitly has also absolved the delayForSearcher call.
    debug("experiment read via local page: %j", restrictedSettings);
    experiment = restrictedSettings.experiment;
    directiveurl = restrictedSettings.sourceUrl;
  } */

  debug("Profile %s pulling directive %s", profile, directiveurl);

  directiveurl = buildAPIurl('directives', experiment)
  const directives = await pullDirectives(directiveurl);

  debug("loaded %d directives from %s", directives.length, directiveurl);

  await writeExperimentInfo(experiment, profinfo, evidencetag, directiveType);

  const browser = await dispatchBrowser(false, profinfo);

  if(browser.newProfile)
    await allowResearcherSomeTimeToSetupTheBrowser(profinfo.profileName);

  const t = await guardoniExecution(experiment, directives, browser, profinfo);
  debug("— Guardoni execution took %s",
    moment.duration(t.end - t.start).humanize());
  await concludeExperiment(experiment, profinfo);
  process.exit(0);
}

async function writeExperimentInfo(experimentId, profinfo, evidencetag, directiveType) {
  debug("Writing experiment Info into extension/experiment.json");
  const cfgfile = path.join('extension', 'experiment.json');
  const expinfo = {
    experimentId,
    evidencetag,
    directiveType,
    execount: profinfo.execount,
    newProfile: profinfo.newProfile,
    when: new Date()
  };
  fs.writeFileSync(cfgfile, JSON.stringify(expinfo), 'utf-8');
  profinfo.expinfo = expinfo;
}

async function dispatchBrowser(headless, profinfo) {

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension'));
  const newProfile = profinfo.newProfile;
  const udd = profinfo.udd;
  const execount = profinfo.execount;
  const chromePath = getChromePath();

  debug("Dispatching a browser in a profile usage count %d", execount);
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

async function guardoniExecution(experiment, directives, browser, profinfo) {
  let retval = { start: null };
  retval.start = moment();
  try {
    const DS = '../src/domainSpecific';
    let domainSpecific = null;
    try {
      domainSpecific = require(DS);
      debug("Loaded domain specific module for: %s", domainSpecific.DOMAIN_NAME);
    } catch(error) {
      console.log("Not found domainSpecific filemodule?", DS, error);
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
    await domainSpecific.beforeDirectives(page, profinfo);
    // the BS above should close existing open tabs except 1st
    await operateBrowser(page, directives, domainSpecific);
    console.log(`Operations completed: check results at ${server}/experiment/#${experiment}`);
    await browser.close();
  } catch(error) {
    console.log("Error in operateBrowser (collection fail):", error);
    await browser.close();
    process.exit(1);
  }
  retval.end = moment();
  return retval;
}

async function concludeExperiment(experiment, profinfo) {
  // this conclude the API sent by extension remoteLookup,
  // a connection to DELETE /api/v3/experiment/:publicKey
  const url = buildAPIurl(
    'experiment',
    moment(profinfo.expinfo.when).toISOString());
  const response = await fetch(url, {
    method: 'DELETE'
  });
  const body = await response.json();
  debug("Marked as completed experiment (%s) in DB! %j",
    experiment, body);
}

async function operateTab(page, directive, domainSpecific, timeout) {

  // TODO the 'timeout' would allow to repeat this operation with
  // different parameters. https://stackoverflow.com/questions/60051954/puppeteer-timeouterror-navigation-timeout-of-30000-ms-exceeded
  await page.goto(directive.url, { 
    waitUntil: "networkidle0",
  });
  debug("— Loading %s (for %dms)", directive.urltag, directive.loadFor);
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
  debug("— Completed %s", directive.urltag);
}

async function operateBrowser(page, directives, domainSpecific) {
  // await page.setViewport({width: 1024, height: 768});
  for (directive of directives) {
    if(nconf.get('exclude') && directive.urltag == nconf.get('exclude')) {
      console.log("excluded!", directive.urltag);
    } else {
      try {
        await operateTab(page, directive, domainSpecific);
      } catch(error) {
        debug("operateTab in %s — error: %s", directive.urltag, error.message);
      }
    }
  }
}

try {

  if(!!nconf.get('h') || !!nconf.get('?') || process.argv.length < 3)
    return printHelp();

  // backend is an option we don't even disclose in the help, 
  // as only developers needs it --chrome as well
  if(!!nconf.get('auto')) {
    console.log("AUTO mode. No mandatory options; --profile, --evidencetag OPTIONAL")
  } else if(!!nconf.get('csv')) {
    console.log("CSV mode: default is --comparison (special is --shadowban); Guardoni exit after upload")
  } else if(!!nconf.get('experiment')) {
    console.log("EXPERIMENT mode: no mandatory options; --profile, --evidencetag OPTIONAL")
  }

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension'));
  const manifest = path.resolve(path.join(cwd, 'extension', 'manifest.json'));
  if(!fs.existsSync(dist))
    fs.mkdirSync(dist);
  if(!fs.existsSync(manifest)) {
    console.log('Manifest in ' + dist + ' not found, the script now would download & unpack');
    const tmpzipf = path.resolve(path.join(cwd, 'extension', 'tmpzipf.zip'));
    console.log("Using " + tmpzipf + " as temporary file");
    downloadExtension(tmpzipf);
  }

  main ();

} catch(error) {
  console.error(error);
  console.error("⬆️ Unhandled error! =( ⬆️");
  process.exit(1);
}
