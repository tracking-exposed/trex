import { Box } from '@mui/material';
import { APIError } from '@shared/errors/APIError';
import { ProfileMetadata } from '@tktrex/shared/models/metadata';
import { ProfileType } from '@tktrex/shared/models/Nature';
import { available, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import * as cells from '../../components/gridCells';
import { ListMetadataRequestInput, Results } from '../../state/queries';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';

export const tikTokPersonalProfile: GetTabouleQueryConf<
  ProfileMetadata,
  ListMetadataRequestInput
> = ({ clients, commands, params }) => ({
  filters: {
    nature: ProfileType.value,
  },
  inputs: inputs.publicKeyInput,
  query: queryStrict<
    ListMetadataRequestInput,
    APIError,
    Results<ProfileMetadata>
  >(
    ({ Query: { filter, ...query } }) =>
      pipe(
        clients.TK.v2.Metadata.ListMetadata({
          Query: {
            ...query,
            filter: {
              ...filter,
              nature: ProfileType.value,
            },
          },
        }),
        TE.map((content) => ({
          total: content.totals.native,
          content: content.data as any[] as ProfileMetadata[],
        }))
      ),
    available
  ),
  actions: (filters) => {
    return (
      <Box textAlign={'right'}>
        <CSVDownloadButton
          onClick={() => {
            void commands.tkDownloadAsCSV({
              Query: {
                ...params,
                type: {
                  ...filters,
                  type: ProfileType.value,
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
      field: 'savingTime',
      headerName: 'when',
      renderCell: cells.distanceFromNowCell,
    },
    // {
    //   ...columnDefault,
    //   field: 'rejected',
    //   headerName: 'was answered?',
    //   width: 40,
    //   renderCell: (params) => {
    //     return <span>{params.formattedValue === true ? '🚫' : '✔️'}</span>;
    //   },
    // },
    {
      ...columnDefault,
      field: 'results',
      renderCell: (params) => {
        return <span>{params.row.results.length}</span>;
      },
      width: 40,
    },
    ...fieldsDefaultTail,
  ],
});
