import * as fs from 'fs';
import _ from 'lodash';

export function getChromePath(): string {
  // this function check for standard chrome executable path and
  // return it. If not found, raise an error
  const knownPaths = [
    '/usr/bin/google-chrome',
    '/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];

  const chromePath = _.find(knownPaths, function (p) {
    return fs.existsSync(p);
  });
  if (!chromePath) {
    // eslint-disable-next-line no-console
    console.log("Tried to guess your Chrome executable and wasn't found");
    // eslint-disable-next-line no-console
    console.log(
      'Solutions: Install Google Chrome in your system or contact the developers'
    );
    process.exit(1);
  }
  return chromePath;
}
