const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('routes:chiaroscuro');

const automo = require('../lib/automo');

async function chiaroScuro(req) {
  const parsedCSV = _.get(req.body, 'parsedCSV', null);
  const nickname = _.get(req.body, 'nickname', null);

  if(_.any([parsedCSV, nickname], _.isNull)) {
      debug("Invalid POST received! %j", req.body);
      return { json: { error: true, message: 'Invalid payload supply' }};
  }

  debug("Registering chiaroScuro for %s", nickname);
  const { experimentId, experimentNumbs } = await automo
    .registerChiaroScuro(parsedCSV, nickname);

  return { json: {
    experimentId,
    experimentNumbs
  }};
};

module.exports = {
  chiaroScuro,
};
