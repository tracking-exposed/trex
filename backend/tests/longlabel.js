const _ = require('lodash');
const debug = require('debug')('tests:parser:longlabel');
const nconf = require('nconf');

const longlabel = require('../../parsers/longlabel');
const labelList = require('./_labelList');

function testllp(f, s, t) {
  // it(f, function() {
  const mined = longlabel.parser(f, s, t);
  fatalCheck('views', mined);
  fatalCheck('timeago', mined);
  fatalCheck('isLive', mined);
  fatalCheck('locale', mined);
  return mined;
  // }); // it non funziona con il debugger;
}

function fatalCheck(keyn, mined) {
  const subject = _.get(mined, keyn);
  if (_.isUndefined(subject)) {
    throw new Error(`fatalCheck lack of |${keyn}|`);
  }
}

/* This first check the capacity of load data from label */
describe('Testing a bunch of aria-label (./_labelList.js)', function () {
  const missingList = {};
  const resultStats = { success: 0, failure: 0 };
  nconf.argv().env();
  const i = _.parseInt(nconf.get('i'));
  const actualList = _.isNaN(i) ? labelList : [_.nth(labelList, i)];
  _.each(actualList, function (labelblock, number) {
    try {
      debug('+[i=%d|%s] <%s>', number, labelblock.source, labelblock.label);
      const r = testllp(labelblock.label, labelblock.source, false);
      debug('.OK %j', r);
      resultStats.success++;
    } catch (e) {
      debug('.Catch error %d %s', number, e.message);
      resultStats.failure++;
      _.set(missingList, e.message + 'i=' + number, labelblock.label);
    }
  });
  debug(
    'Collected %d exceptions: %s success counters %s',
    _.size(_.keys(missingList)),
    JSON.stringify(missingList, undefined, 2),
    JSON.stringify(resultStats, undefined, 2)
  );
});
