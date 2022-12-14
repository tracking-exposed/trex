import { Box } from '@mui/material';
import { HomeMetadata } from '@yttrex/shared/models/metadata/HomeMetadata';
import { HomeNatureType } from '@yttrex/shared/models/Nature';
import { available, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import ExpandView from '../../components/expand-view/ExpandView';
import { ParsedInfoList } from '../../components/list/ParsedInfoList';
import { ListMetadataRequestInput } from '../../state/queries';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';

export const youtubePersonalHomes: GetTabouleQueryConf<
  HomeMetadata,
  ListMetadataRequestInput
> = ({ clients, commands, params }) => ({
  inputs: (params, setParams) => (
    <div>
      {inputs.publicKeyInput(params, setParams)}
      {inputs.experimentIdInput(params, setParams)}
    </div>
  ),
  filters: {
    nature: HomeNatureType.value,
  },
  query: queryStrict(
    ({ Query: { amount, skip, filter, ...query } }) =>
      pipe(
        clients.YT.v2.Metadata.ListMetadata({
          ValidateOutput: false,
          Query: {
            ...query,
            amount: (amount + '') as any,
            skip: (skip + '') as any,
            format: 'json',
            filter,
          },
        } as any),
        TE.map((content) => ({
          total: content.totals.home,
          content: content.data as any[] as HomeMetadata[],
        }))
      ),
    available
  ),
  actions: ({ filter, ...params }) => {
    return (
      <Box textAlign={'right'}>
        <CSVDownloadButton
          onClick={() => {
            void commands.ytDownloadAsCSV({
              Query: {
                ...params,
                amount: 1000,
                format: 'csv',
                filter: {
                  ...filter,
                  nature: HomeNatureType.value,
                },
              },
            })();
          }}
        />
      </Box>
    );
  },

  expanded: ({ row, ...props }) => {
    return (
      <ExpandView {...props}>
        <ParsedInfoList data={row.selected} />
      </ExpandView>
    );
  },
  columns: [
    ...fieldsDefaultHead,
    {
      ...columnDefault,
      filterable: true,
      field: 'login',
      minWidth: 100,
      type: 'boolean',
    },
    {
      ...columnDefault,
      field: 'selected',
      renderCell: (params) => {
        if (Array.isArray(params.value)) {
          return params.value.length;
        }
        return 0;
      },
    },
    {
      ...columnDefault,
      field: 'sections',
      renderCell: (params) => {
        if (Array.isArray(params.value)) {
          return params.value.length;
        }
        return 0;
      },
    },

    ...fieldsDefaultTail,
  ],
});
