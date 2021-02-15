const _ = require('lodash');
const debug = require('debug')('methodology:test-1');
const puppeteer = require("puppeteer-extra")
const { TimeoutError } = require("puppeteer/lib/api");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const nconf = require('nconf');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

nconf.argv().env();

defaultAfter = async function(page, directive) {
  debug("This function might be implemented");
}
defaultBefore = async function(page, directive) {
  debug("This function might be implemented");
}

async function main() {

  const sourceUrl = nconf.get('source');
  if(!sourceUrl) {
    console.log("Mandatory --source URL/that/serve.a.json");
    console.log(`must be a list of [{
      "delay": <number in millisec>,
      "url": "https://tobeopenedand/waited/for/delay",
      "name": "optional, in case you want to label and see a debug line"
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
        debug("NOTE DON'T YET TESTED IN APPLE/LINUX");
        localbrowser = path.join(effectivedir, 'chrome.exe');
      } else {
        console.log("NOTE DON'T YET TESTED IN APPLE/LINUX");
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
      console.log("try --source https://gist.githubusercontent.com/vecna/c8d1236881f42319a815cd3a4a37c6bc/raw/c2f440fcae3990fa348f64e953a737a749a23522/guardoni-directive-yt-1.json")
      process.exit(1);
    }
  } catch (error) {
    debug("Error: %s", error.message);
    console.log(error.response.body);
    process.exit(1);
  }

  const dist = path.resolve(path.join(cwd, 'extension'));
  if(!fs.existsSync(dist)) {
    console.log('Directory '+ dist +' not found, please download & unpack:');
    console.log('https://github.com/tracking-exposed/yttrex/releases/download/1.4.99/extension.zip');
    console.log("be sure to unpacked files in: " + dist);
    process.exit(1)
  }

  const profile = nconf.get('profile');
  if(!profile) {
    console.log("--profile it is necessary and be absolute or relative path; You might want to execute:");
    console.log(localbrowser, "--user-data-dir=profiles/<YOUR PROFILE NAME> to init browser");
    process.exit(1)
  }

  const udd = path.resolve(profile);
  if(!fs.existsSync(udd)) {
    console.log("--profile directory do not exist" + udd);
    console.log(localbrowser," --user-data-dir=profiles/path to initialize a new profile");
    process.exit(1)
  }
  console.log("you might want to execute:");
  console.log(localbrowser, "--user-data-dir=profiles/<YOUR PROFILE NAME> to init browser");

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
      debug("+loaded %j", directive);
      try {
        await domainSpecific.beforeWait(page, directive);
      } catch(error) {
        console.log("error in beforeWait", error.message);
      }
      console.log("Directive to URL " + directive.url+
        "now'll wait for " + directive.delay || 4000);
      await page.waitFor(directive.delay || 4000);
      console.log("Done waiting...");
      try {
        await domainSpecific.afterWait(page, directive);
      } catch(error) {
        console.log("error in afterWait", error.message);
      }
      debug("-completed %j", directive);
    }
  }
  console.log("Loop done, processed directives:", directives.length);
}

main ();