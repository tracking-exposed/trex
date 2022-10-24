import * as endpoints from '@shared/endpoints/helper';
import { v2 } from '@yttrex/shared/endpoints';
import D from 'debug';
import _ from 'lodash';
import automo from '../lib/automo';
import moment from 'moment';
import CSV from '../lib/CSV';
import * as utils from '../lib/utils';
import * as express from 'express';

const debug = D('routes:metadata');

// This variables is used as cap in every readLimit below
const PUBLIC_AMOUNT_ELEMS = 100;

const listMetadata = async (req: express.Request): Promise<any> => {
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

  const metadata = await automo
    .getMetadataByFilter(filter, {
      amount,
      skip,
    })
    .then((mm) =>
      mm.map(({ publicKey, _id, id, ...m }) => ({
        ...m,
        id: id.substring(0, 20),
        supporter: utils.string2Food(publicKey)
      }))
    );

  debug(
    'Returning metadata by experimentId %s, %d evidences',
    experimentId,
    _.size(metadata)
  );

  if (format === 'csv') {
    const csv = CSV.produceCSVv1(metadata);
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
