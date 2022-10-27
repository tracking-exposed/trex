import { PersonalData } from '@tktrex/shared/models/personal';
import _ from 'lodash';
import moment from 'moment';
import * as automo from '../lib/automo';
import CSV from '../lib/CSV';
import * as foodUtils from '@shared/utils/food.utils';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('routes:personal');

const CSV_MAX_SIZE = 9000;

async function getPersonal(req: any): Promise<any> {
  // personal API format is
  // /api/v1/personal/:publicKey/:what/:format
  const k = req.params.publicKey;

  const amount = _.parseInt(req.query.amount) || 50;
  const skip = _.parseInt(req.query.skip) || 0;
  const what = req.params.what;
  const allowed = [
    'summary',
    'search',
    'foryou',
    'following',
    'profile',
    'native',
  ];

  if (!allowed.includes(what)) {
    return {
      json: {
        what,
        allowed,
        error: true,
        details: 'Invalid parameter',
      },
    };
  }

  debug(
    'Requested data [nature %s] (%d-%d), preparing JSON',
    what,
    amount,
    skip
  );

  try {
    let filter;
    let retval: any = null;

    if (what === 'summary') {
      filter = { type: { $in: ['following', 'foryou'] } };
      retval = await automo.getPersonalTableData(k, filter, { amount, skip });
    } else if (what === 'search') {
      /* this function access to 'search' results which is a
       * bit different than the other. as in the collection
       * there is not one entry for video, but one entry for search
       * query --> hence, the _.map/_.pick
       * note, this data should match
       * packages/shared/src/models/contributor/ContributorPersonalSummary.ts
       */
      const avail: any = await automo.getPersonalTableData(
        k,
        { type: 'search' },
        { amount, skip }
      );

      if (avail.json?.error) {
        return { json: avail.json };
      }

      const metadata = _.map(avail.metadata, function (o) {
        const smf: any = _.pick(o, ['id', 'query', 'savingTime']);
        smf.rejected = !!o.message?.length;
        smf.results = o.results?.length || 0;
        smf.sources = _.uniq(
          _.map(o.results || [], function (v) {
            return v.video.authorId;
          })
        );
        return smf;
      });
      retval = {
        counters: { metadata: avail.counters?.metadata },
        metadata,
      };
    } else if (what === 'profile') {
      /* this function access to 'search' results which is a
       * bit different than the other. as in the collection
       * there is not one entry for video, but one entry for search
       * query --> hence, the _.map/_.pick
       * note, this data should match
       * packages/shared/src/models/contributor/ContributorPersonalSummary.ts
       */
      const avail: any = await automo.getPersonalTableData(
        k,
        { type: 'profile' },
        { amount, skip }
      );
      if (avail.json?.error) {
        return avail.json;
      }

      retval = {
        counters: { metadata: avail.counters?.metadata },
        metadata: avail.metadata,
      };
    } else if (what === 'foryou' || what === 'following') {
      retval = await automo.getMetadataByFilter(
        { type: what, publicKey: k },
        { amount, skip }
      );
      retval = _.map(retval, function (e) {
        e.pseudo = foodUtils.string2Food(e.publicKey);
        _.unset(e, 'publicKey');
        return e;
      });
    } else if (what === 'native') {
      const data: any = await automo.getPersonalTableData(
        k,
        { type: 'native' },
        { amount, skip }
      );

      if (data.json?.error) {
        return data.json;
      }
      retval = {
        counters: { metadata: data.counters?.metadata },
        metadata: data.metadata,
      };
    } else {
      throw new Error('Invalid and unsupported request type');
    }

    return { json: retval };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    debug('getPersonal handled error: %s', message);
    return { json: { error: true, message } };
  }
}

async function getPersonalCSV(req: any): Promise<any> {
  const CSV_MAX_SIZE = 9000;
  const k = req.params.publicKey;
  const type = req.params.what;

  if (!['foryou', 'search', 'following', 'profile', 'native'].includes(type))
    return { text: 'Error, nature not supported ' };

  const { data } = await automo
    .getMetadataByFilter(
      { publicKey: k, type },
      { amount: CSV_MAX_SIZE, skip: 0 }
    )
    .then(({ totals, data }) => ({
      totals,
      data: data.map(({ _id, publicKey, ...m }) => ({
        ...m,
        supporter: foodUtils.string2Food(publicKey),
      })),
    }));

  if (!data.length) {
    debug("getPersonalCSV didn't found DB entry matching %o", {
      publicKey: k,
      type,
    });
    return { text: 'No data not found in the DB' };
  }

  debug(
    'type [%s] return %d with amount %d skip-zero',
    type,
    data.length,
    CSV_MAX_SIZE
  );

  const unrolledData = CSV.unrollNested(data, {
    type,
    experiment: true,
  });

  if (!unrolledData.length) {
    debug(
      'getPersonalCSV produced empty data during transformation: investigate parsers and pipeline!'
    );
    return { text: 'Data not found, from metadata: ' + data.length };
  }

  /* XXX TMP FIXME (not if we pick the pseudo via mongodb) 
     sanitization & enhancement:
    1) we add here the pseudonym
    2) if a string appears in a metric, it is 0 -- this is a parser bug */
  const pseudo = foodUtils.string2Food(unrolledData[0].publicKey);
  const ready = _.map(unrolledData, function (e) {
    e.pseudo = pseudo;
    if (_.isString(e.sharen)) e.sharen = 0;
    return e;
  });

  // console.table(ready);
  const csv = CSV.produceCSVv1(ready);

  debug(
    'getPersonalCSV produced %d entries from %d metadata (type %s), %d bytes (max %d)',
    ready.length,
    data.length,
    type,
    csv.length,
    CSV_MAX_SIZE
  );

  const filename =
    'tk-' +
    type +
    '-' +
    moment().format('YY-MM-DD') +
    '--' +
    ready.length +
    '.csv';

  return {
    headers: {
      'Content-Type': 'csv/text',
      'Content-Disposition': 'attachment; filename=' + filename,
    },
    text: csv,
  };
}

/*
async function removeEvidence(req) {
    const k =  req.params.publicKey;
    if(_.size(k) < 26)
        return { json: { "message": "Invalid publicKey", "error": true }};

    const id = req.params.id;
    const result = await automo.deleteEntry(k, id);
    debug("Requeste delete of metadataId %s deleted %d video and %d metadata",
        id, _.size(result.videoId), _.size(result.metadata));
    return { json: { success: true, result }};
};
*/

const getPersonalByExperimentId = async (
  req: any
): Promise<{ json: PersonalData } | { headers: any; text: string }> => {
  const experimentId = req.params.experimentId;
  const publicKey = req.params.publicKey;
  const format = req.params.format;

  const supporter = await automo.getSupporterByPublicKey(publicKey);

  const opts = { amount: 100, skip: 0 };

  // debug('Html ids %O', htmlIds);

  const { data: metadata } = await automo
    .getMetadataByFilter(
      {
        publicKey: {
          $eq: publicKey,
        },
        experimentId: {
          $eq: experimentId,
        },
      },
      opts
    )
    .then(({ totals, data }) => ({
      totals,
      data: data.map(({ publicKey, ...m }) => ({
        ...m,
        supporter: foodUtils.string2Food(publicKey),
      })),
    }));

  if (format === 'csv') {
    const csv = CSV.produceCSVv1(metadata);

    debug('getPersonalCSV (%d)', metadata.length, csv.length, CSV_MAX_SIZE);

    const filename =
      'tk-' + experimentId + '-' + moment().format('YY-MM-DD') + '.csv';

    return {
      headers: {
        'Content-Type': 'csv/text',
        'Content-Disposition': 'attachment; filename=' + filename,
      },
      text: csv,
    };
  }

  return {
    json: {
      supporter,
      metadata,
    },
  };
};

export { getPersonal, getPersonalCSV, getPersonalByExperimentId };
