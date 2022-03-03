#!/usr/bin/env node
const _ = require('lodash');
const countries = require('./countries');
const fs = require('fs');
const mongo = require('../backend/lib/mongo3');
const path = require('path/posix');
const debug = require('debug')('tto:importer');
const parserlibrary = require('../backend/lib/parserlibrary-prototype');

/* this file take as input a directory, looks for the file which aren't
 * imported yet, and import them */

function getFiles(dirname) {
  const files = fs.readdirSync(dirname);

  return _.compact(
    _.map(files, function(fname) {
      if (_.endsWith(fname, '.imported'))
        return null;

      return path.join(dirname, fname);
    }),
  );
}

function sources() {
  const dirname = process.argv.pop();
  if (!dirname && !dirname.length)
    throw new Error('We need a directory as parameter');

  const check = fs.statSync(dirname);
  if (!check.isDirectory())
    throw new Error('We need a directory and it is not a directory!');

  debug('Reading from directory %s', dirname);
  return getFiles(dirname);
}

function parser(filename) {
  const data = fs.readFileSync(filename, {encoding:'utf8', flag:'r'});
  parserlibrary.process(data, "tiktok", "fullpage", "foryou");
  debugger;
}

async function importer(files) {
  const metadata = _.map(files, parser);

  const mongoc = await mongo.clientConnect({concurrency: 1});
  // this is a temporary collection or might be permanent
  const results = await mongo.insertMany(mongoc, "observatory", metadata);

  await mongoc.close();
  return results;
}

try {
  const files = sources();
  importer(files);
} catch (error) {
  debug('Unmanaged error catch at the end: %s', error.message);
}
