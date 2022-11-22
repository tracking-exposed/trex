import * as endpoints from '@shared/endpoints/helper';
import { v2 } from '@yttrex/shared/endpoints';
import { ListMetadataResponse } from '@yttrex/shared/models/http/metadata/output/ListMetadata.output';
import { ListMetadataQuery } from '@yttrex/shared/models/http/metadata/query/ListMetadata.query';
import D from 'debug';
import * as express from 'express';
import _ from 'lodash';
import moment from 'moment';
import automo from '../lib/automo';
import CSV from '../lib/CSV';
import * as utils from '../lib/utils';

const debug = D('routes:metadata');

// This variables is used as cap in every readLimit below
const PUBLIC_AMOUNT_ELEMS = 100;

const listMetadata = async (
  req: express.Request
): Promise<{ json: ListMetadataResponse } | { headers: any; text: string }> => {
  const { query } = endpoints.decodeOrThrowRequest(
    v2.Metadata.ListMetadata,
    req
  ) as any as { query: ListMetadataQuery };

  debug('Build metadata filter from query %O', query);

  const {
    publicKey,
    experimentId,
    researchTag,
    amount = PUBLIC_AMOUNT_ELEMS,
    skip = 0,
    format,
    filter: queryFilter,
  } = query;

  const filter = {} as any;
  if (publicKey) {
    filter.publicKey = publicKey;
  }

  if (queryFilter?.nature) {
    filter.type = queryFilter.nature;
    switch (queryFilter.nature) {
      case 'search': {
        const { query: searchQ } = queryFilter;
        if (searchQ) {
          filter.query = {
            $regex: new RegExp(searchQ, 'i'),
          };
        }
        break;
      }
      case 'video': {
        const { authorName, title } = queryFilter;
        if (title) {
          filter.title = {
            $regex: new RegExp(title, 'i'),
          };
        }
        if (authorName) {
          filter.authorName = {
            $regex: new RegExp(authorName, 'i'),
          };
        }
        break;
      }
      case 'home': {
        const { login } = queryFilter;

        if (typeof login !== 'undefined') {
          filter.login = {
            $eq: login,
          };
        }
      }
    }
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
            researchTag: m.researchTag ?? undefined,
            experimentId: m.experimentId ?? undefined,
            savingTime: m.savingTime.toISOString(),
            clientTime: m.clientTime.toISOString(),
            supporter: utils.string2Food(publicKey),
          } as any)
      ),
    }));

  debug(
    'Returning %d evidences of %j available',
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
