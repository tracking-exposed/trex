import { toAPIError } from '@shared/errors/APIError';
import { decodeOrThrowRequest } from '@shared/endpoints/helper';
import endpoints from '@tktrex/shared/endpoints/v2/metadata.endpoints';
import createDebug from 'debug';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { toTKMetadata } from '../io/metadata.io';
import _ from 'lodash';
import * as automo from '../lib/automo';
import { throwTE } from '@shared/utils/task.utils';
import { AppError } from '@shared/errors/AppError';
import moment from 'moment';
import CSV from '../lib/CSV';
import { ListMetadataOutput } from '@tktrex/shared/models/http/metadata/output/ListMetadata.output';
import { ListMetadataQuery } from '@tktrex/shared/models/http/metadata/query/ListMetadata.query';

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
    TE.chain(({ totals, data }) => {
      debug('Metadata by %O, %d evidences', filter, _.size(data));
      return pipe(
        data.map(toTKMetadata),
        A.sequence(E.Applicative),
        E.map((d) => ({ data: d, totals })),
        TE.fromEither
      );
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

      return TE.right({ json: metadata });
    }),
    throwTE
  );
};

export { listMetadata };
