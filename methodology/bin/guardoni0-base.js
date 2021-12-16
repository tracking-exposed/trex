#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('guardoni:notes');
const info = require('debug')('guardoni:info');
const puppeteer = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const fs = require('fs');
const path = require('path');
const nconf = require('nconf');
const moment = require('moment');
const fetch = require('node-fetch');

const domainSpecific = require('../src/domainSpecific');

const defaultCfgPath = path.join("config", "default.json");
nconf.argv().env();
nconf.defaults({
  config: defaultCfgPath
});
const configFile = nconf.get('config');
nconf.argv().env().file(configFile);

/* this also happens in 'src/domainSpecific' and causes debug to print regardless of the 
 * environment variable sets */
debug.enabled = info.enabled = true;

const server = nconf.get('backend') ?
  ( _.endsWith(nconf.get('backend'), '/') ? 
    nconf.get('backend').replace(/\/$/, '') : nconf.get('backend') ) : 
  'https://tiktok.tracking.exposed';

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
  console.log("You should now LOGIN ON TikTok!\n\n...then press any key.");
  console.log('\n~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~');
  await keypress();
  console.log("\n[Received] Reproduction starts now!")
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

function buildAPIurl(route, params) {
  return `${server}/api/v3/${route}/${params}`;
}

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
      // directives = JSON.parse(fs.readFileSync(sourceUrl, 'utf-8'));
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

function profileExecount(profile, evidencetag) {
  let data; let newProfile = false;
  const udd = path.resolve(path.join('profiles', profile));
  const guardfile = path.join(udd, 'guardoni.json');
  if (!fs.existsSync(udd)) {
    console.log("--profile hasn't a directory. Creating " + udd);
    try {
      fs.mkdirSync(udd, {recursive: true});
    } catch (error) {
      console.log("Unable to create directory:", error.message);
      process.exit(1)
    }
    newProfile = true;
  }

  if (!newProfile) {
    const jdata = fs.readFileSync(guardfile, 'utf-8');
    data = JSON.parse(jdata);
    debug("Profile %s read %d execount", profile, data.execount);
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
  data.udd = udd;
  fs.writeFileSync(guardfile, JSON.stringify(data, undefined, 2), 'utf-8');
  debug("profile %s wrote %j", profile, data);
  return data;
}

function printHelp() {
  const helptext = `\nOptions can be set via: env , --longopts, and ${defaultCfgPath} file

To quickly test the tool, execute and follow instructions:
   --auto <1 or 2>:\tdefault 1, a.k.a. "Greta experiment"

To register an experiment:
   --csv FILENAME.csv\tdefault is --comparison, optional --shadowban

To execute a known experiment:
   --experiment <experimentId>

Advanced options:
   --evidencetag <string>
   --profile <string>
   --config <file>
   --proxy <string>
   --advdump <directory>
   --3rd
   --headless

.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:.
\nhttps://youtube.tracking.exposed/guardoni for full documentation.
You need a reliable internet connection to ensure a flawless collection`;
  console.log(".:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:.");
  console.log(helptext);
  console.log('~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~');
}

async function writeExperimentInfo(experimentId, profinfo, evidencetag, directiveType) {
  debug("Saving experiment info in extension/experiment.json (would be read by the extension)");
  const cfgfile = path.join('extension', 'experiment.json');
  const expinfo = {
    experimentId,
    evidencetag,
    directiveType,
    execount: profinfo.execount,
    profileName: profinfo.profileName,
    newProfile: profinfo.newProfile,
    when: new Date()
  };
  fs.writeFileSync(cfgfile, JSON.stringify(expinfo), 'utf-8');
  profinfo.expinfo = expinfo;
}

async function main() {

  const searchFile= nconf.get('searches');
  
  if(!searchFile) {
    debug("Mandatory --searches option with a .txt file containing one search per line");
    process.exit(1);
  }

  const rawf = fs.readFileSync(searchFile, 'utf-8');
  const queries = _.reduce(rawf.split('\n'), function(memo, query) {
    const sureq = query.trim();
    if(sureq.length)
      memo.push(sureq);
    return memo;
  }, [])

  if (!queries.length ) {
    debug("Error, we need --searches and you should be a .txt FILE, with a query per each line");
    process.exit(1);
  }

  const evidencetag = nconf.get('evidencetag') || 'no-tag-' + _.random(0, 0xffff);
  let profile = nconf.get('profile');
  if (!profile)
    profile = nconf.get('evidencetag') ?
      evidencetag : `guardoni-${moment().format("YYYY-MM-DD")}`;
  /* if not profile, if evidencetag take it, or use a daily profile */

  debug("Configuring browser for profile %s (evidencetag %s)", profile, evidencetag);
  const profinfo = await profileExecount(profile, evidencetag);

  /* pullDirectives SKIPPED! local generation, this is part of v0 */
  const directives = _.map(queries, function(q, counter) {
    const u = "https://tiktok.com/search?q=" + q;
    console.log(u);
    return {
      url: u,
      loadFor: 5500,
      name: `search-for-${q}-${counter}`,
      query: q,
    }
  });
  
  // debug("Fetching experiment directives (%s)", directiveurl);
  // debug("Profile %s pulling directive %s", profile, directiveurl);
  // const directives = await pullDirectives(directiveurl);
  const directiveType = 'search';

  // debug("Loaded %d directives, detected type [%s] from %s",
  //  directives.length, directiveType, directiveurl);
  const experiment = "exp" + _.reduce(JSON.stringify(queries).split(''), function(memo, e) { return memo + e.charCodeAt(0) }, 0);
  await writeExperimentInfo(experiment, profinfo, evidencetag, directiveType);

  const headless = (!!nconf.get('headless'));
  const browser = await dispatchBrowser(headless, profinfo);

  if(browser.newProfile)
    await allowResearcherSomeTimeToSetupTheBrowser(profinfo.profileName);

  const t = await guardoniExecution(experiment, directives, browser, profinfo);
  console.log("— Guardoni execution completed in ",
    moment.duration(t.end - t.start).humanize());

  await concludeExperiment(experiment, profinfo);
  process.exit(0);
}

async function dispatchBrowser(headless, profinfo) {

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension'));
  const newProfile = profinfo.newProfile;
  const execount = profinfo.execount;
  const chromePath = getChromePath();
  const proxy = nconf.get('proxy');

  const commandLineArg = ["--no-sandbox",
    "--disabled-setuid-sandbox",
    "--load-extension=" + dist,
    "--disable-extensions-except=" + dist,
  ];

  if(proxy) {
    if(!_.startsWith(proxy, 'socks5://')) {
      console.log("Error, --proxy must start with socks5://");
      process.exit(1);
    }
    commandLineArg.push("--proxy-server=" + proxy);
    debug("Dispatching browser: profile usage count %d proxy %s",
      execount, proxy);
  }
  else {
    debug("Dispatching browser: profile usage count %d, with NO PROXY",
      execount);
  }

  try {
    puppeteer.use(pluginStealth());
    const browser = await puppeteer.launch({
        headless,
        userDataDir: profinfo.udd,
        executablePath: chromePath,
        args: commandLineArg,
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

async function operateTab(page, directive) {

  try {
    await domainSpecific.beforeLoad(page, directive);
  } catch(error) {
    debug("error in beforeLoad %s %s directive %o",
      error.message, error.stack, directive);
  }

  debug("— Loading %s (for %dms)", directive.urltag ?
    directive.urltag : directive.name, directive.loadFor);
  // Remind you can exclude directive with env/--exclude=urltag

  // TODO the 'timeout' would allow to repeat this operation with
  // different parameters. https://stackoverflow.com/questions/60051954/puppeteer-timeouterror-navigation-timeout-of-30000-ms-exceeded
  await page.goto(directive.url, { 
    waitUntil: "networkidle0",
  });

  try {
    await domainSpecific.beforeWait(page, directive);
  } catch(error) {
    console.log("error in beforeWait", error.message, error.stack);
  }

  const loadFor = _.parseInt(nconf.get('load')) || directive.loadFor;
  debug("Directive to URL %s, Loading delay %d (--load optional)", directive.url, loadFor);
  await page.waitForTimeout(loadFor);

  try {
    await domainSpecific.afterWait(page, directive);
  } catch(error) {
    console.log("Error in afterWait", error.message, error.stack);
  }
  debug("— Completed %s", directive.urltag ? directive.urltag : directive.name);
}


async function operateBrowser(page, directives) {
  // await page.setViewport({width: 1024, height: 768});
  for (const directive of directives) {
    if(nconf.get('exclude') && directive.urltag == nconf.get('exclude')) {
      debug("[!!!] excluded directive %s", directive.urltag);
    } else {
      try {
        await operateTab(page, directive);
      } catch(error) {
        debug("operateTab in %s — error: %s", directive.urltag, error.message);
      }
    }
  }
  const loadFor = _.parseInt(nconf.get('load')) || directives[0].loadFor;
  if(loadFor < 20000) {
    await page.waitForTimeout(15000);
  }
}

async function guardoniExecution(experiment, directives, browser, profinfo) {
  const retval = { start: null };
  retval.start = moment();
  const directiveType = _.first(directives).name ? "chiaroscuro" : "comparison";
  try {
    const page = (await browser.pages())[0];
    _.tail(await browser.pages()).forEach(async function(opage) {
      debug("Closing a tab that shouldn't be there!");
      await opage.close();
    })
    await domainSpecific.beforeDirectives(page, profinfo);
    // the BS above should close existing open tabs except 1st
    await operateBrowser(page, directives);
    const publicKey = await domainSpecific.completed();
    console.log(`Operations completed: check results at ${server}/${directiveType === 'chiaroscuro' ? "shadowban" : "experiments"}/render/#${experiment}`);
    console.log(`Personal log at ${server}/personal/#${publicKey}`);
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
  if(body.acknowledged !== true)
    debug("Error in communication with the server o_O (%j)", body);
  //  debug("Experiment %s marked as completed on the server!", experiment);
}

try {

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension'));
  const manifest = path.resolve(path.join(cwd, 'extension', 'manifest.json'));

  if(!fs.existsSync(dist))
    fs.mkdirSync(dist);

  if(!fs.existsSync(manifest)) {
    console.log('Manifest in ' + dist + ' not found: proceed with manual installation and remind opt-in');
    process.exit(1);
  }

  main();

} catch(error) {
  console.error(error);
  console.error("⬆️ Unhandled error! =( ⬆️");
  process.exit(1);
}
