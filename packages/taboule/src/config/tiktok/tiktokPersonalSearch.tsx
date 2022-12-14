import { Box } from '@mui/material';
import { APIError } from '@shared/errors/APIError';
import { SearchMetadata } from '@tktrex/shared/models/metadata';
import { SearchType } from '@tktrex/shared/models/Nature';
import { SearchNatureType } from '@yttrex/shared/models/Nature';
import { available, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import { ListMetadataRequestInput, Results } from '../../state/queries';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';
import * as TE from 'fp-ts/TaskEither';

export const tikTokPersonalSearch: GetTabouleQueryConf<
  SearchMetadata,
  ListMetadataRequestInput
> = ({ clients, commands, params }) => ({
  filters: {
    nature: SearchType.value,
  },
  inputs: inputs.publicKeyInput,
  query: queryStrict<
    ListMetadataRequestInput,
    APIError,
    Results<SearchMetadata>
  >(
    ({ Query: { amount, skip, filter, ...query } }) =>
      pipe(
        clients.TK.v2.Metadata.ListMetadata({
          ValidateOutput: false,
          Query: {
            ...query,
            amount,
            skip,
            filter: {
              query: undefined,
              ...filter,
              nature: SearchType.value,
            },
          },
        } as any),
        TE.map((content) => ({
          total: content.totals.search,
          content: content.data as any[] as SearchMetadata[],
        }))
      ),
    available
  ),
  actions: (filter) => {
    return (
      <Box textAlign={'right'}>
        <CSVDownloadButton
          onClick={() => {
            void commands.tkDownloadAsCSV({
              Query: {
                ...params,
                filter: {
                  ...filter,
                  type: SearchNatureType.value,
                },
              },
            })();
          }}
        />
      </Box>
    );
  },
  columns: [
    ...fieldsDefaultHead,
    {
      ...columnDefault,
      field: 'query',
      renderCell: (params) => {
        return (
          <a href={`/search/#${encodeURI(params.formattedValue as string)}`}>
            {params.formattedValue}
          </a>
        );
      },
    },
    {
      ...columnDefault,
      field: 'results',
      renderCell: (params) => {
        return <span>{(params.row.results ?? []).length}</span>;
      },
      width: 40,
    },
    ...fieldsDefaultTail,
  ],
});
