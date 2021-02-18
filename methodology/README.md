Tools and commands for automated youtube testing

# [Install nodejs in your system](https://nodejs.org/en/download://nodejs.org/en/download/)

# Copy the git repository locally

* download: https://github.com/tracking-exposed/yttrex/archive/master.zip
* unpack
* enter in `methodology` directory

# Things to know about the script `src/guardoni.js`

1. it have to follow a list of URL retrieved from a JSON list reachable on the web. You can decide which URL, we offer two of them as default: [conservative](https://youtube.tracking.exposed/bin/conservative-filtertube.json), [progressive](https://youtube.tracking.exposed/bin/progressive-filtertube.json).
2. you have to create a directory where the chrome-profile would live. we suggest to create a directory in `methodology/profiles/` 
3. you have to download a .zip (the browser extension of [youtube.tracking.exposed](/)) and unpack it `methodology/extension/`

What you're ready, guardoni.js is a script that uses puppeteer and automate chrome.
for our video we configured the method to watch them till the end. In other pages and other cases you might want to train your profile

# Examples

`node scr/guardoni.js --source https://youtube.tracking.exposed/bin/conservative-filtertube.json --profile profiles/conservative1`

or, if you enable debug:

`DEBUG=*,-puppeteer:* node src/guardoni.js --source https://youtube.tracking.exposed/bin/progressive-filtertube.json --profile profiles/progressiv1`
