#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('guardoni:cli');
const puppeteer = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const fs = require('fs');
const path = require('path');
const nconf = require('nconf');
const fetch = require('node-fetch');
const moment = require('moment');
const execSync = require('child_process').execSync;

const DEFAULT_LOADms = 2345; // two seconds and 345 ms.
const COMMANDJSONEXAMPLE = "https://youtube.tracking.exposed/json/automation-example.json";
const EXTENSION_WITH_OPT_IN_ALREADY_CHECKED='https://github.com/tracking-exposed/yttrex/releases/download/1.4.99/extension.zip';

nconf.argv().env();

defaultAfter = async function(page, directive) {
  debug("This function might be implemented");
}
defaultBefore = async function(page, directive) {
  debug("This function might be implemented");
}

async function keypress() {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}

async function allowResearcherSomeTimeToSetupTheBrowser() {
  console.log("Now you can configure your chrome browser, define default settings and when you're done, press enter");
  await keypress();
}

function downloadExtension(zipFileP) {
  debug("Executing curl and unzip (if these binary aren't present in your system please mail support at tracking dot exposed because you might have worst problems)");
  execSync('curl -L ' + EXTENSION_WITH_OPT_IN_ALREADY_CHECKED + " -o " + zipFileP);
  execSync('unzip ' + zipFileP + " -d extension");
}

async function main() {

  const sourceUrl = nconf.get('source');
  if(!sourceUrl) {
    console.log("Mandatory configuration! for example --source " + COMMANDJSONEXAMPLE);
    console.log("Via --source you can specify and URL OR a local file")
    console.log(`\nIt should be a valid JSON with objects like: [ {
      "watchFor": <number in millisec>,
      "url": "https://youtube.come/v?videoNumber1",
      "name": "optional, in case you want to see this label, specifiy DEBUG=* as environment var"
    }, {...}
]\n\tDocumentation: https://youtube.tracking.exposed/automation`);
    process.exit(1);
  }

  let directives;
  try {
    if(_.startsWith(sourceUrl, 'http')) {
      const response = await fetch(sourceUrl);
      if(response.status !== 200) {
        console.log("Error in fetching directives from URL", response.status);
        process.exit(1);
      }
      directives = await response.json();
      debug("directives loaded from URL: %j", _.map(directives, 'name'));
    } else {
      directives = JSON.parse(fs.readFileSync(sourceUrl, 'utf-8'));
      debug("directives loaded from file: %j", _.map(directives, 'name'));
    }
    if(!directives.length) {
      console.log("URL/file do not include any directive in expected format");
      console.log("Check the example with --source ", COMMANDJSONEXAMPLE);
      process.exit(1);
    }
  } catch (error) {
    console.log("Error in retriving directive URL: " + error.message);
    // console.log(error.response.body);
    process.exit(1);
  }

  const dist = path.resolve(path.join(cwd, 'extension'));
  const manifest = path.resolve(path.join(cwd, 'extension', 'manifest.json'));
  if(!fs.existsSync(manifest)) {
    console.log('Manifest in ' + dist + ' not found, the script now would download & unpack');
    const tmpzipf = path.resolve(path.join(cwd, 'extension', 'tmpzipf.zip'));
    console.log("Using " + tmpzipf + " as temporary file");
    downloadExtension(tmpzipf);
  }

  const profile = nconf.get('profile');
  if(!profile) {
    console.log("--profile it is necessary and if you don't have one: pick up a name and this tool would assist during the creation");
    // console.log(localbrowser, "--user-data-dir=profiles/<YOUR PROFILE NAME> to init browser");
    process.exit(1)
  }

  let setupDelay = false;
  const udd = path.resolve(path.join('profiles', profile));
  if(!fs.existsSync(udd)) {
    console.log("--profile name hasn't an associated directory: " + udd + "\nLet's create it!");
    // console.log(localbrowser," --user-data-dir=profiles/path to initialize a new profile");
    // process.exit(1)
    fs.mkdirSync(udd);
    setupDelay = true;
  }

  /* enrich directives with profile and experiment name */
  const experiment = nconf.get('experiment');
  directives = _.map(directives, function(d) {
    if(experiment)
      d.experiment = experiment;
    d.profile = profile;
    d.humanized = _.isInteger(d.watchFor) ?
      moment.duration(d.watchFor).humanize() :
      d.watchFor += "";
    return d;
  });

  let browser = null;
  try {
    puppeteer.use(pluginStealth());
    browser = await puppeteer.launch({
        headless: false,
        userDataDir: udd,
        args: ["--no-sandbox",
          "--disabled-setuid-sandbox",
          "--load-extension=" + dist,
          "--disable-extensions-except=" + dist
        ],
    });
  
    if(setupDelay)
      await allowResearcherSomeTimeToSetupTheBrowser();

    const DS = './domainSpecific';
    let domainSpecific = null;
    try {
      domainSpecific = require(DS);
    } catch(error) {
      console.log("Not found domainSpecific!?", DS, error);
      domainSpecific = {
        beforeWait: defaultBefore,
        afterWait: defaultAfter,
      };
    }
    const page = (await browser.pages())[0];
    _.tail(await browser.pages()).forEach(async function(opage) {
      debug("Closing a tab that shouldn't be there!");
      await opage.close();
    })
    // the BS above should close existing open tabs except 1st
    await operateBroweser(page, directives, domainSpecific);
    await browser.close();
  } catch(error) {
    console.log("Error in operateBrowser (collection fail):", error);
    await browser.close();
    process.exit(1);
  }
  if(experiment) {
    debug("Automation with %d directives completed, marking experiment [%s] on the server",
      directives.length, experiment);
    await markingExperiment(experiment, directives);
  } else {
    debug("Automation completed! executed %d directives", directives.length);
  }
  process.exit(0);
}

async function markingExperiment(expname, directives) {
  let server = nconf.get('backend') ? nconf.get('backend') : 'https://youtube.tracking.exposed';
  if(_.endsWith(server, '/')) server = server.replace(/\/$/, '');
  const uri = `${server}/api/v2/experiment`;
  const explogfile = path.join("logs", directive.experiment + ".json");
  const explog = JSON.parse(
    fs.readFileSync(explogfile, 'utf-8')
  )
  const payload = _.reduce(directives, function(memo, d) {
    memo.videos.push(_.pick(d, ['url', 'name']));
    return memo;
  }, {
    experiment: expname,
    profile: directives[0].profile,
    videos: [],
    publicKey: explog.publicKey,
    when: explog.when
  });
  const commit = await fetch(uri, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    }
  });
  const result = await commit.json();
  debug("Server answer: %s", JSON.stringify(result, undefined, 2));
  console.log("Fetch material from https://youtube.tracking.exposed/api/v2/experiment/" + expname);
}

async function operateBroweser(page, directives, domainSpecific) {
  // await page.setViewport({width: 1024, height: 768});
  for (directive of directives) {
    if(nconf.get('exclude') && directive.name == nconf.get('exclude')) {
      console.log("excluded!", directive.name);
    } else {
      await page.goto(directive.url, { 
        waitUntil: "networkidle0",
      });
      debug("— Loading %s (for %s)", directive.name, directive.humanized);
      try {
        await domainSpecific.beforeWait(page, directive);
      } catch(error) {
        console.log("error in beforeWait", error.message, error.stack);
      }
      const openPageDuration = directive.loadFor || DEFAULT_LOADms;
      debug("Directive to URL %s, Loading delay %d", directive.url, openPageDuration);
      await page.waitFor(openPageDuration);
      console.log("Done loading wait. Calling domainSpecific");
      try {
        await domainSpecific.afterWait(page, directive);
      } catch(error) {
        console.log("Error in afterWait", error.message, error.stack);
      }
      debug("— Completed %s", directive.name);
    }
  }
}

main ();
