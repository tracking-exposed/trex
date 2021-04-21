#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('methodology:guardoni');
const puppeteer = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const fs = require('fs');
const path = require('path');
const nconf = require('nconf');
const fetch = require('node-fetch');
const execSync = require('child_process').execSync;

const DEFAULT_WATCHING_MILLISECONDS = 6789;
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
  execSync('curl -L ' + EXTENSION_WITH_OPT_IN_ALREADY_CHECKED + " -o " + zipFileP);
  execSync('unzip ' + zipFileP + " -d extension");
}

async function main() {

  const sourceUrl = nconf.get('source');
  if(!sourceUrl) {
    console.log("Mandatory configuration! for example --source " + COMMANDJSONEXAMPLE);
    console.log(`must be a list of JSON objects like: [{
      "watchFor": <number in millisec>,
      "url": "https://youtube.come/v?...",
      "name": "optional, in case you want to see this label, specifiy DEBUG=* as environment var"
    }, {
  } ]`);
    process.exit(1);
  }

  /* finding chrome local executable */
  const cwd = process.cwd();

  const localchromium = path.join(cwd, 'node_modules', 'puppeteer', '.local-chromium');
  let localbrowser = null;
  fs.readdir(localchromium, (err, files) => {
    // node_modules/puppeteer/.local-chromium/win64-722234/chrome-win/chrome.exe*
    const platformdir = path.join(localchromium, files[0]);
    fs.readdir(platformdir, (err, files) => {
      const effectivedir = path.join(platformdir, files[0]);
      if(files[0] == 'chrome-win') {
        localbrowser = path.join(effectivedir, 'chrome.exe');
      } else {
        localbrowser = path.join(effectivedir, 'chrome');
      }
    });
  });

  let directives;
  try {
    const response = await fetch(sourceUrl);
    if(response.status !== 200) {
      console.log("response", response.status);
      process.exit(1);
    }
    directives = await response.json();
    debug("directives: %s", JSON.stringify(directives, undefined, 2));
    if(!directives.length) {
      console.log("Url do not include any directive in [list] format");
      console.log("try for example --source ", COMMANDJSONEXAMPLE);
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
    fs.mkdirSync('udd');
    setupDelay = true;
  }

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
      console.log("Not found!?", DS, error);
      domainSpecific = {
        beforeWait: defaultBefore,
        afterWait: defaultAfter,
      };
    }
    const page = (await browser.pages())[0];
    _.tail(await browser.pages()).forEach(async function(opage) {
      await opage.close();
    })
    // the BS above should close existing open tabs except 1st
    await operateBroweser(page, directives, domainSpecific);
    await browser.close();
  } catch(error) {
    console.log("Bad! Bad—Error:", error);
    await browser.close();
    process.exit(1);
  }
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
      debug("+Loading %j", directive);
      try {
        await domainSpecific.beforeWait(page, directive);
      } catch(error) {
        console.log("error in beforeWait", error.message);
      }
      const WATCH_FOR = directive.watchFor || DEFAULT_WATCHING_MILLISECONDS;
      console.log("Directive to URL " + directive.url + "Loading delay:" + WATCH_FOR);
      await page.waitFor(WATCH_FOR);
      console.log("Done loading wait. calling domainSpecific");
      try {
        await domainSpecific.afterWait(page, directive);
      } catch(error) {
        console.log("error in afterWait", error.message);
      }
      debug("-Completed %j", directive);
    }
  }
  console.log("Loop done, processed directives:", directives.length);
}

main ();