import * as endpoints from '@shared/endpoints/helper';
import { v2 } from '@yttrex/shared/endpoints';
import D from 'debug';
import _ from 'lodash';
import automo from '../lib/automo';
import moment from 'moment';
import CSV from '../lib/CSV';
import * as utils from '../lib/utils';
import * as express from 'express';
import { ListMetadataResponse } from '@yttrex/shared/endpoints/v2/metadata.endpoints';

const debug = D('routes:metadata');

// This variables is used as cap in every readLimit below
const PUBLIC_AMOUNT_ELEMS = 100;

const listMetadata = async (
  req: express.Request
): Promise<{ json: ListMetadataResponse } | { headers: any; text: string }> => {
  const {
    query: {
      publicKey,
      nature,
      experimentId,
      researchTag,
      amount = PUBLIC_AMOUNT_ELEMS,
      skip = 0,
      format,
    },
  } = endpoints.decodeOrThrowRequest(v2.Metadata.ListMetadata, req);

  const filter = {} as any;
  if (publicKey) {
    filter.publicKey = publicKey;
  }
  if (nature) {
    filter.type = nature;
  }
  if (experimentId) {
    filter.experimentId = experimentId;
  }
  if (researchTag) {
    filter.researchTag = researchTag;
  }

  debug('Filtering metadata with %O (%d, %d)', filter, amount, skip);

  const metadata = await automo
    .getMetadataByFilter(filter, {
      amount,
      skip,
    })
    .then(({ data, totals }) => ({
      totals,
      data: data.map(
        ({ publicKey, _id, id, ...m }) =>
          ({
            ...m,
            id: id.substring(0, 20),
            savingTime: m.savingTime.toISOString(),
            clientTime: m.clientTime.toISOString(),
            supporter: utils.string2Food(publicKey),
          } as any)
      ),
    }));

  debug(
    'Returning %d evidences of %d available',
    _.size(metadata.data),
    metadata.totals
  );

  if (format === 'csv') {
    const csv = CSV.produceCSVv1(metadata.data);
    let filename = `metadata`;
    filename += experimentId ? `-experiment-${experimentId}` : '';
    filename += researchTag ? `-research_tag-${researchTag}` : '';
    filename += '-' + moment().format('YY-MM-DD') + '.csv';

    debug('VideoCSV: produced %d bytes, returning %s', _.size(csv), filename);

    // if (!_.size(csv)) return { text: 'Error, Zorry: 🤷' };

    return {
      headers: {
        'Content-Type': 'csv/text',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
      text: csv,
    };
  }

  return { json: metadata };
};

export { listMetadata };
