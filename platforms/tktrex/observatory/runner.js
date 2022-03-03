#!/usr/bin/env node
const _ = require('lodash');
const countries = require('./countries');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');
const debug = require('debug')('tto:runner');

const testableCountries = countries.twocc; // todo in the future would be the DB saying which are.

// console.log(testableCountries);

function connector(cindex) {

    const cc = _.toLower(_.nth(testableCountries, cindex));
    const time = new Date().getTime() + "";
    const destpath = path.join("mass", cc, time)
    const destdir = path.join("mass", cc);

    debug("Connecting to %s", countries.namecc[cindex]);
    try {
        fs.mkdirSync(destdir);
    } catch(error) {
        if(error.code !== "EEXIST")
            console.log(error);
    }

    child_process.spawnSync("curl", [
        "-A",
        "Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/81.0",
        "--proxy",
        "zproxy.lum-superproxy.io:22225",
        "--proxy-user",
        "user"+cc+":password",
        "-kis",
        "https://www.tiktok.com/foryou",
        "-o",
        destpath
    ]);

    const stats = fs.statSync(destpath);

    debug("%d> Completed %s (%s %d)", cindex,
        countries.namecc[cindex], cc, stats.size);
}

function main() {
    console.log("Starting...");
    _.times(207, connector);
    console.log("Completed!");
}
main();
