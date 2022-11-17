import { decodeOrThrowRequest } from '@shared/endpoints/helper';
import { toAPIError } from '@shared/errors/APIError';
import { AppError } from '@shared/errors/AppError';
import { throwTE } from '@shared/utils/task.utils';
import endpoints from '@tktrex/shared/endpoints/v2/metadata.endpoints';
import { ListMetadataOutput } from '@tktrex/shared/models/http/output/ListMetadata.output';
import { ListMetadataQuery } from '@tktrex/shared/models/http/query/ListMetadata.query';
import createDebug from 'debug';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import _ from 'lodash';
import moment from 'moment';
import { toTKMetadata } from '../io/metadata.io';
import * as automo from '../lib/automo';
import CSV from '../lib/CSV';

const debug = createDebug('routes:public');

// This variables is used as cap in every readLimit below
const PUBLIC_AMOUNT_ELEMS = 100;

type ListMetadataResponse =
  | { json: ListMetadataOutput }
  | { headers: any; text: string };

const listMetadata = async (req: any): Promise<ListMetadataResponse> => {
  const { query } = decodeOrThrowRequest(
    endpoints.ListMetadata,
    req
  ) as any as {
    query: ListMetadataQuery;
  };

  debug('Filter metadata with query %O', query);

  const {
    researchTag,
    experimentId,
    publicKey,
    filter: queryFilter,
    amount = PUBLIC_AMOUNT_ELEMS,
    skip = 0,
    format,
  } = query;

  debug('Filter metadata with query %O', query);

  const filter = {} as any;
  if (publicKey) {
    filter.publicKey = publicKey;
  }
  if (experimentId) {
    filter.experimentId = experimentId;
  }
  if (researchTag) {
    filter.researchTag = researchTag;
  }

  if (queryFilter?.nature) {
    filter['nature.type'] = queryFilter.nature;

    switch (queryFilter.nature) {
      case 'search': {
        const { query: q } = queryFilter;
        if (q) {
          filter.query = {
            $regex: new RegExp(q, 'i'),
          };
        }
        break;
      }
      case 'foryou': {
        const { description } = queryFilter;
        if (description) {
          filter.description = {
            $regex: new RegExp(description, 'i'),
          };
        }
        break;
      }
      case 'native': {
        const { description } = queryFilter;

        if (description) {
          filter.description = {
            $regex: new RegExp(description, 'i'),
          };
        }
        break;
      }
    }
  }

  debug('Filtering metadata for %O (%d, %d)', filter, amount, skip);

  return pipe(
    TE.tryCatch(
      () =>
        automo.getMetadataByFilter(filter, {
          amount,
          skip,
        }),
      toAPIError
    ),
    /**
     * Disable the validation of the output for the moment
     */
    TE.map(({ totals, data }) => {
      debug('Metadata by %O, %d evidences', filter, _.size(data));
      return {
        totals,
        data: data.map(toTKMetadata),
      };
    }),
    TE.chain((metadata): TE.TaskEither<AppError, ListMetadataResponse> => {
      if (format === 'csv') {
        const csv = CSV.produceCSVv1(metadata.data);
        let filename = `metadata`;
        filename += experimentId ? `-experiment-${experimentId}` : '';
        filename += researchTag ? `-research_tag-${researchTag}` : '';
        filename += '-' + moment().format('YY-MM-DD') + '.csv';

        debug(
          'VideoCSV: produced %d bytes, returning %s',
          _.size(csv),
          filename
        );

        // if (!_.size(csv)) return { text: 'Error, Zorry: 🤷' };

        return TE.right({
          headers: {
            'Content-Type': 'csv/text',
            'Content-Disposition': `attachment; filename=${filename}`,
          },
          text: csv,
        });
      }

      return TE.right({ json: metadata as any });
    }),
    throwTE
  );
};

export { listMetadata };
