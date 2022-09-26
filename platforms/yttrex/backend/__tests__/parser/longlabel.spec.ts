import _ from 'lodash';
import moment, { duration } from 'moment';
import nconf from 'nconf';
import {
  getPublicationTime,
  parser,
} from '@yttrex/shared/parser/parsers/longlabel';
const labelList = require('../fixtures/label-with-source-list');
import { Test, GetTest } from '../../tests/Test';
import { debug } from 'console';

function fatalCheck(keyn, mined) {
  const subject = _.get(mined, keyn);
  if (_.isUndefined(subject)) {
    throw new Error(`fatalCheck lack of |${keyn}|`);
  }
}

function testllp(f, s, t) {
  // it(f, function() {
  const mined = parser(f, s, t);
  fatalCheck('views', mined);
  fatalCheck('timeago', mined);
  fatalCheck('isLive', mined);
  fatalCheck('locale', mined);
  return mined;
  // }); // it non funziona con il debugger;
}

describe('Parser: Long Label', () => {
  let appTest: Test;
  jest.setTimeout(20 * 1000);

  beforeAll(async () => {
    appTest = await GetTest();
  });

  describe('getPublicationTime', () => {
    test('succeeds with timePrecision equal to "error" when "recommendedPubTime" is not provided', () => {
      const label = '1 day ago 8 minutes, 46 seconds';
      const receivedPublicationTime = getPublicationTime(label);

      expect(receivedPublicationTime).toStrictEqual(duration({ day: 1 }));
    });

    test('succeeds when parsing the entire label', () => {
      const label: [string, string, any][] = [
        // [
        //   'Pourquoi sortir le pied de la couette est-il si efficace ? de Scilabus il y a 1 an 13 minutes et 39 secondes 1 052 309 vues Scilabus',
        //   {
        //     views: 1052309,
        //     isLive: false,
        //   },
        // ],
        [
          'Why I’m Keeping the Apple Mac Studio but Am Ditching the Studio Display // What I Got Instead 👀 by JAde Wii 1 day ago 8 minutes, 46 seconds 2,006 views',
          'JAde Wii',
          {
            views: 2006,
            isLive: false,
            timeago: moment.duration({ days: 1 }),
          },
        ],
      ];
      label.forEach(([l, authorSource, expectedResult]) => {
        const parseResult = parser(l, authorSource, false);
        expect(parseResult).toMatchObject(expectedResult);
      });
    });
  });

  test.skip('recommended channels', () => {
    const longlabel = require('../fixtures/longlabels.json');
    longlabel.forEach(([label, source, isLive, testViews]) => {
      let parseResult;
      try {
        parseResult = parser(label, source, isLive);
      } catch (e) {}
      expect(testViews).toBe(parseResult?.views);
    });
  });

  /* This first check the capacity of load data from label */
  test('Testing a bunch of aria-label (./_labelList.js)', () => {
    const missingList = {};
    const resultStats = { success: 0, failure: 0 };
    nconf.argv().env();
    const i = _.parseInt(nconf.get('i'));
    const actualList = _.isNaN(i) ? labelList : [_.nth(labelList, i)];
    _.each(actualList, function (labelblock, number) {
      try {
        // appTest.logger.debug(
        //   '+[i=%d|%s] <%s>',
        //   number,
        //   labelblock.source,
        //   labelblock.label
        // );
        const r = testllp(labelblock.label, labelblock.source, false);
        // appTest.logger.debug('.OK %j', r);
        resultStats.success++;
      } catch (e) {
        appTest.logger.error('.Catch error %d %s', number, e.message);
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
});
