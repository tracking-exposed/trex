/* eslint-disable */

const _ = require('lodash');
const debug = require('debug')('guardoni:notes');
const info = require('debug')('guardoni:info');
const puppeteer = require('puppeteer-core');
// const pluginStealth = require("puppeteer-extra-plugin-stealth");
const fs = require('fs');
const path = require('path');
const nconf = require('nconf');
const moment = require('moment');
const axios = require('axios');
const execSync = require('child_process').execSync;
const parse = require('csv-parse/lib/sync');

const domainSpecific = require('./domainSpecific');

const COMMANDJSONEXAMPLE =
  'https://youtube.tracking.exposed/json/automation-example.json';
const EXTENSION_WITH_OPT_IN_ALREADY_CHECKED =
  'https://github.com/tracking-exposed/yttrex/releases/download/v1.8.992/extension-1.9.0.99.zip';

const defaultCfgPath = path.join('config', 'default.json');
nconf.argv().env();
nconf.defaults({
  config: defaultCfgPath,
});
const configFile = nconf.get('config');
nconf.argv().env().file(configFile);

/* this also happens in 'src/domainSpecific' and causes debug to print regardless of the
 * environment variable sets */
debug.enabled = info.enabled = true;

const server = nconf.get('backend')
  ? _.endsWith(nconf.get('backend'), '/')
    ? nconf.get('backend').replace(/\/$/, '')
    : nconf.get('backend')
  : 'https://youtube.tracking.exposed';

async function keypress() {
  process.stdin.setRawMode(true);
  return new Promise((resolve) =>
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    })
  );
}

async function allowResearcherSomeTimeToSetupTheBrowser(profileName) {
  console.log(
    '\n\n.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:.'
  );
  console.log('Creating profile', profileName);
  console.log('You should see a chrome browser (with yttrex installed)');
  console.log(
    '\nPLEASE in that window, open youtube.com and accept cookie banner.'
  );
  console.log('ONLY AFTER, press ANY KEY here. It will start the collection');
  console.log("\n(If you don't accept the cookie banner the test might fail)");
  console.log(
    "\nnext time you'll use the same profile, this step would not appear."
  );
  console.log(
    '\n~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~'
  );
  await keypress();
  console.log('\n[Received] Reproduction starts now!');
}

function downloadExtension(zipFileP) {
  debug(
    "Executing curl and unzip (if these binary aren't present in your system please mail support at tracking dot exposed because you might have worst problems)"
  );
  execSync(
    'curl -L ' + EXTENSION_WITH_OPT_IN_ALREADY_CHECKED + ' -o ' + zipFileP
  );
  execSync('unzip ' + zipFileP + ' -d extension');
}

export function getChromePath() {
  // this function check for standard chrome executabled path and
  // return it. If not found, raise an error
  const knownPaths = [
    '/usr/bin/google-chrome',
    '/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];

  const chromePath = _.find(knownPaths, function (p) {
    return fs.existsSync(p);
  });
  if (!chromePath) {
    console.log("Tried to guess your Chrome executable and wasn't found");
    console.log(
      'Solutions: Install Google Chrome in your system or contact the developers'
    );
    process.exit(1);
  }
  return chromePath;
}

export function buildAPIurl(route, params) {
  if (
    route === 'directives' &&
    ['chiaroscuro', 'comparison'].indexOf(params) !== -1
  )
    return `${server}/api/v3/${route}/${params}`;
  else {
    return `${server}/api/v3/${route}/${params}`;
  }
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
      skip_empty_lines: true,
    });
    debug(
      'Read input from file %s (%d bytes) %d records',
      csvfile,
      input.length,
      records.length
    );
  } catch (error) {
    console.log('Error: invalid CSV file from options --csv ', error.message);
    process.exit(1);
  }

  const uniqueKeys = _.sortBy(
    _.uniq(_.flatten(_.map(records, _.keys))),
    'length'
  );
  let euk = []; // effective unique keys
  if (directiveType === 'chiaroscuro')
    euk = _.sortBy(['videoURL', 'title'], 'length');
  else if (directiveType === 'comparison')
    euk = _.sortBy(['url', 'urltag', 'watchFor']);
  else throw new Error('Unmanaged directiveType');

  if (
    _.filter(uniqueKeys, function (keyavail) {
      return euk.indexOf(keyavail) === -1;
    }).length
  ) {
    console.log('Invalid CSV key read. expected only these:', euk);
    console.log(
      'You can find examples on https://youtube.tracking.exposed/guardoni'
    );
    process.exit(1);
  } else {
    debug('CSV validated in [%s] format specifications', directiveType);
  }

  const registeruri = buildAPIurl('directives', directiveType);
  // implemented in backend/routes/directives.js
  debug('Registering CSV via %s', registeruri);

  try {
    const commit = await axios.post(registeruri, {
      method: 'POST',
      body: JSON.stringify({ parsedCSV: records }),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    const experimentInfo = await commit.json();
    if (experimentInfo.error)
      return console.log(
        'Error received from the server: ',
        experimentInfo.message
      );

    return experimentInfo;
    // contains .experimentId and .status (created|exist)
  } catch (error) {
    console.log('Failure in talking with API:', error.message);
    return null;
  }
}

export async function pullDirectives(sourceUrl) {
  let directives = null;
  try {
    if (_.startsWith(sourceUrl, 'http')) {
      const response = await axios.get(sourceUrl);
      if (response.status !== 200) {
        console.log('Error in fetching directives from URL', response.status);
        process.exit(1);
      }
      directives = await response.data;
    } else {
      throw new Error("A local file isn't supported anymore");
      // directives = JSON.parse(fs.readFileSync(sourceUrl, 'utf-8'));
    }
    if (!directives.length) {
      console.log('URL/file do not include any directive in expected format');
      console.log('Example is --directive ', COMMANDJSONEXAMPLE);
      process.exit(1);
    }
    return directives;
  } catch (error) {
    console.log('Error in retriving directive URL: ' + error.message);
    // console.log(error.response.body);
    process.exit(1);
  }
}

// async function readExperiment(profinfo) {
//   /* this function is invoked to dispatch the assistance window.
//    * it is a piece of dead code, at the moment, but this would
//    * start when --auto is invoked -- AT THE MOMENT IS NOT USED */
//   let page;
//   let experiment = null;

//   const browser = await dispatchBrowser(false, profinfo);

//   try {
//     page = (await browser.pages())[0];
//     _.tail(await browser.pages()).forEach(async function (opage) {
//       debug("Closing a tab that shouldn't be there!");
//       await opage.close();
//     });

//     const introPage = path.join(process.cwd(), "static", "index.html");
//     await page.goto(introPage);
//   } catch (error) {
//     debug("Browser forcefully closed? %s", error.message);
//     if (experiment)
//       return {
//         experiment,
//         sourceUrl: buildAPIurl("directives", experiment),
//       };
//     else {
//       console.log("Browser closed before experiment was selected: quitting");
//       process.exit(1);
//     }
//   }

//   const poller = setInterval(async function () {
//     let inputs = [];
//     try {
//       inputs = await page.$$eval("input[type=radio]", function (elist) {
//         return elist.map(function (e) {
//           if (e.checked) {
//             return { experiment: e.getAttribute("experimentId") };
//           }
//         });
//       });
//     } catch (error) {
//       clearInterval(poller);
//       console.log(
//         "Failure in interacting with browser, still you've to wait a few seconds. Error message:"
//       );
//       console.log("\t" + error.message);
//     }

//     const selected = _.compact(inputs);
//     if (selected.length) {
//       experiment = selected[0].experiment;
//       await page.$eval("#nextstep", function (e) {
//         e.removeAttribute("disabled");
//       });
//     }

//     if (experiment) {
//       clearInterval(poller);
//       page.waitForTimeout(900);
//       page.goto("https://www.youtube.com");
//     }
//   }, 1600);

//   const seconds = 30;
//   console.log(
//     `You've ${seconds} seconds to select your experiment and accept cookies banner on YouTube!;`
//   );

//   try {
//     await page.waitForTimeout(1000 * seconds);
//     if (!experiment) clearInterval(poller);
//     await browser.close();
//   } catch (error) {
//     console.log("Error in browser/page control:", error.message);
//     process.exit(1);
//   }

//   if (!experiment) {
//     console.log("Error: you should has select an experiment from the browser!");
//     process.exit(1);
//   }

//   return {
//     experiment,
//     sourceUrl: buildAPIurl("directives", experiment),
//   };
// }

export function profileExecount(profile, evidencetag) {
  let data;
  let newProfile = false;
  const udd = path.resolve(path.join('profiles', profile));
  const guardfile = path.join(udd, 'guardoni.json');
  if (!fs.existsSync(udd)) {
    console.log("--profile hasn't a directory. Creating " + udd);
    try {
      fs.mkdirSync(udd, { recursive: true });
    } catch (error) {
      console.log('Unable to create directory:', error.message);
      process.exit(1);
    }
    newProfile = true;
  }

  if (!newProfile) {
    const jdata = fs.readFileSync(guardfile, 'utf-8');
    data = JSON.parse(jdata);
    debug('profile %s read %d execount', profile, data.execount);
    data.execount += 1;
    data.evidencetags.push(evidencetag);
  } else {
    data = {
      execount: 1,
      evidencetags: [evidencetag],
    };
  }

  data.newProfile = newProfile;
  data.profileName = profile;
  data.udd = udd;
  fs.writeFileSync(guardfile, JSON.stringify(data, undefined, 2), 'utf-8');
  debug('profile %s wrote %j', profile, data);
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
  console.log(
    '.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:._.:*~*:.'
  );
  console.log(helptext);
  console.log(
    '~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~'
  );
}

async function writeExperimentInfo(
  experimentId,
  profinfo,
  evidencetag,
  directiveType
) {
  debug(
    'Saving experiment info in extension/experiment.json (would be read by the extension)'
  );
  const cfgfile = path.join('extension', 'experiment.json');
  const expinfo = {
    experimentId,
    evidencetag,
    directiveType,
    execount: profinfo.execount,
    profileName: profinfo.profileName,
    newProfile: profinfo.newProfile,
    when: new Date(),
  };
  fs.writeFileSync(cfgfile, JSON.stringify(expinfo), 'utf-8');
  profinfo.expinfo = expinfo;
}

export async function main() {
  const auto = nconf.get('auto');
  const shadowban = nconf.get('shadowban');
  let experiment = nconf.get('experiment');
  const sourceUrl = nconf.get('csv');

  /* directiveType is an important variable but when
     --experiment is used, it is not specify. Therefore
     is set below, after the directive is pull */
  let directiveType = experiment
    ? null
    : shadowban
    ? 'chiaroscuro'
    : 'comparison';

  if (!auto && !sourceUrl && !experiment) {
    printHelp();
    process.exit(1);
  }

  if (auto === '2') {
    debug('Selected experiment n.2 (codename: Naomi)');
    experiment = 'd75f9eaf465d2cd555de65eaf61a770c82d59451';
  } else if (auto === '1' || !!nconf.get('auto')) {
    debug('Selected experiment n.1 (codename: Greta)');
    experiment = '37384a9b7dff26184cdea226ad5666ca8cbbf456';
  }

  if (sourceUrl) {
    debug('Registering CSV %s as %s', sourceUrl, directiveType);
    const feedback = await registerCSV(directiveType);
    if (feedback && feedback.since) {
      debug(
        'CSV %s, experimentId %s exists since %s',
        feedback.status,
        feedback.experimentId,
        feedback.since
      );
      console.log(feedback.experimentId);
    } else if (feedback && feedback.experimentId) {
      debug(
        'Directive from CSV created: experimentId %s',
        feedback.experimentId
      );
      console.log(feedback.experimentId);
    } else console.log('CSV error in upload.');

    process.exit(1);
  }

  if (experiment && (!_.isString(experiment) || experiment.length < 20)) {
    console.log('\n--experiment awaits for an experiment ID, try it out:');
    console.log(
      'For example: --experiment d75f9eaf465d2cd555de65eaf61a770c82d59451'
    );
    process.exit(1);
  }

  if (sourceUrl && experiment) {
    console.log(
      "Error: when registering a CSV, you can't specify the --experiment"
    );
    process.exit(1);
  }

  const evidencetag =
    nconf.get('evidencetag') || 'no-tag-' + _.random(0, 0xffff);
  let profile = nconf.get('profile');
  if (!profile)
    profile = nconf.get('evidencetag')
      ? evidencetag
      : `guardoni-${moment().format('YYYY-MM-DD')}`;
  /* if not profile, if evidencetag take it, or use a daily profile */

  debug(
    'Configuring browser for profile %s (evidencetag %s)',
    profile,
    evidencetag
  );
  const profinfo = await profileExecount(profile, evidencetag);
  let directiveurl = null;

  if (experiment && !sourceUrl) {
    directiveurl = buildAPIurl('directives', experiment);
    debug('Fetching experiment directives (%s)', directiveurl);
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

  debug('Profile %s pulling directive %s', profile, directiveurl);

  directiveurl = buildAPIurl('directives', experiment);
  const directives = await pullDirectives(directiveurl);
  directiveType = _.first(directives).name ? 'chiaroscuro' : 'comparison';

  debug(
    'Loaded %d directives, detected type [%s] from %s',
    directives.length,
    directiveType,
    directiveurl
  );

  await writeExperimentInfo(experiment, profinfo, evidencetag, directiveType);

  const headless = !!nconf.get('headless');
  const browser = await dispatchBrowser(headless, profinfo);

  if (browser.newProfile)
    await allowResearcherSomeTimeToSetupTheBrowser(profinfo.profileName);

  const t = await guardoniExecution(experiment, directives, browser, profinfo);
  console.log(
    '— Guardoni execution completed in ',
    moment.duration(t.end - t.start).humanize()
  );

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

  const commandLineArg = [
    '--no-sandbox',
    '--disabled-setuid-sandbox',
    '--load-extension=' + dist,
    '--disable-extensions-except=' + dist,
  ];

  if (proxy) {
    if (!_.startsWith(proxy, 'socks5://')) {
      console.log('Error, --proxy must start with socks5://');
      process.exit(1);
    }
    commandLineArg.push('--proxy-server=' + proxy);
    debug(
      'Dispatching browser: profile usage count %d proxy %s',
      execount,
      proxy
    );
  } else {
    debug(
      'Dispatching browser: profile usage count %d, with NO PROXY',
      execount
    );
  }
  try {
    // puppeteer.use(pluginStealth());
    const browser = await puppeteer.launch({
      headless,
      userDataDir: profinfo.udd,
      executablePath: chromePath,
      args: commandLineArg,
    });

    // add this boolean to the return value as we need it in a case
    browser.newProfile = newProfile;
    return browser;
  } catch (error) {
    console.log('Error in dispatchBrowser:', error.message);
    await browser.close();
    process.exit(1);
  }
}

async function operateTab(page, directive) {
  try {
    await domainSpecific.beforeLoad(page, directive);
  } catch (error) {
    debug(
      'error in beforeLoad %s %s directive %o',
      error.message,
      error.stack,
      directive
    );
  }

  debug(
    '— Loading %s (for %dms)',
    directive.urltag ? directive.urltag : directive.name,
    directive.loadFor
  );
  // Remind you can exclude directive with env/--exclude=urltag

  // TODO the 'timeout' would allow to repeat this operation with
  // different parameters. https://stackoverflow.com/questions/60051954/puppeteer-timeouterror-navigation-timeout-of-30000-ms-exceeded
  await page.goto(directive.url, {
    waitUntil: 'networkidle0',
  });

  try {
    await domainSpecific.beforeWait(page, directive);
  } catch (error) {
    console.log('error in beforeWait', error.message, error.stack);
  }

  const loadFor = _.parseInt(nconf.get('load')) || directive.loadFor;
  debug(
    'Directive to URL %s, Loading delay %d (--load optional)',
    directive.url,
    loadFor
  );
  await page.waitForTimeout(loadFor);

  try {
    await domainSpecific.afterWait(page, directive);
  } catch (error) {
    console.log('Error in afterWait', error.message, error.stack);
  }
  debug('— Completed %s', directive.urltag ? directive.urltag : directive.name);
}

export function initialSetup() {
  if (!!nconf.get('h') || !!nconf.get('?') || process.argv.length < 3)
    return printHelp();

  // backend is an option we don't even disclose in the help,
  // as only developers needs it --chrome as well
  if (nconf.get('auto')) {
    info('AUTO mode. No mandatory options; --profile, --evidencetag OPTIONAL');
  } else if (nconf.get('csv')) {
    info(
      'CSV mode: default is --comparison (special is --shadowban); Guardoni exit after upload'
    );
  } else if (nconf.get('experiment')) {
    info(
      'EXPERIMENT mode: no mandatory options; --profile, --evidencetag OPTIONAL'
    );
  }

  // check if the additional directory for screenshot is present
  const advdump = nconf.get('advdump');
  if (advdump) {
    /* if the advertisement dumping folder is set, first we check
     * if exist, and if doens't we call it fatal error */
    if (!fs.existsSync(advdump)) {
      debug('--advdump folder (%s) not exist: creating', advdump);
      fs.mkdirSync(advdump, { recursive: true });
    }
    debug(
      'Advertisement screenshotting enable in folder: %s',
      path.resolve(advdump)
    );
  }

  const cwd = process.cwd();
  const dist = path.resolve(path.join(cwd, 'extension'));
  const manifest = path.resolve(path.join(cwd, 'extension', 'manifest.json'));
  if (!fs.existsSync(dist)) fs.mkdirSync(dist);
  if (!fs.existsSync(manifest)) {
    console.log(
      'Manifest in ' +
        dist +
        ' not found, the script now would download & unpack'
    );
    const tmpzipf = path.resolve(path.join(cwd, 'extension', 'tmpzipf.zip'));
    console.log('Using ' + tmpzipf + ' as temporary file');
    downloadExtension(tmpzipf);
  }

  return manifest;
}

async function operateBrowser(page, directives) {
  // await page.setViewport({width: 1024, height: 768});
  for (const directive of directives) {
    if (nconf.get('exclude') && directive.urltag == nconf.get('exclude')) {
      debug('[!!!] excluded directive %s', directive.urltag);
    } else {
      try {
        await operateTab(page, directive);
      } catch (error) {
        debug('operateTab in %s — error: %s', directive.urltag, error.message);
      }
    }
  }
  const loadFor = _.parseInt(nconf.get('load')) || directive.loadFor;
  if (loadFor < 20000) {
    await page.waitForTimeout(15000);
  }
}

export async function guardoniExecution(
  experiment,
  directives,
  page,
  profinfo
) {
  const retval = { start: null };
  retval.start = moment();
  const directiveType = _.first(directives).name ? 'chiaroscuro' : 'comparison';
  try {
    // const page = (await browser.pages())[0];
    // _.tail(await browser.pages()).forEach(async function (opage) {
    //   debug("Closing a tab that shouldn't be there!");
    //   await opage.close();
    // });
    await domainSpecific.beforeDirectives(page, profinfo);
    // the BS above should close existing open tabs except 1st
    await operateBrowser(page, directives);
    const publicKey = await domainSpecific.completed();
    console.log(
      `Operations completed: check results at ${server}/${
        directiveType === 'chiaroscuro' ? 'shadowban' : 'experiments'
      }/render/#${experiment}`
    );
    console.log(`Personal log at ${server}/personal/#${publicKey}`);
    await browser.close();
  } catch (error) {
    console.log('Error in operateBrowser (collection fail):', error);
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
    moment(profinfo.expinfo.when).toISOString()
  );
  const response = await fetch(url, {
    method: 'DELETE',
  });
  const body = await response.json();
  if (body.acknowledged !== true)
    debug('Error in communication with the server o_O (%j)', body);
  //  debug("Experiment %s marked as completed on the server!", experiment);
}

export async function validateAndStart(manifest) {
  /* initial test is meant to assure the extension is an acceptable version */

  const manifestValues = JSON.parse(fs.readFileSync(manifest));
  const vblocks = manifestValues.version.split('.');
  /* guardoni versioning explained:
    1.MAJOR.MINOR, 
    MINOR that starts with 99 or more 99 are meant to be auto opt-in
    MAJOR depends on the package.json version and it is used for feature support 
    a possible version 2.x isn't foresaw at the moment
   */
  const MINIMUM_ACCEPTABLE_MAJOR = 8;
  if (_.parseInt(vblocks[1]) < MINIMUM_ACCEPTABLE_MAJOR) {
    console.log(
      "Error/Warning: in the directory 'extension/' the software is too old: remove it!"
    );
    process.exit(1);
  }

  if (!_.startsWith(vblocks[2], '99')) {
    console.log(
      'Warning/Reminder: the extension used might not be opt-in! YOU NEED TO DO IT BY HAND'
    );
    console.log('<Press any key to start>');
    await keypress();
  }

  /* this finally start the main execution */
  await main();
}
