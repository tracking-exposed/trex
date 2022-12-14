import { Box } from '@mui/material';
import { NativeMetadata } from '@tktrex/shared/models/metadata';
import { NativeType } from '@tktrex/shared/models/Nature';
import { available, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as React from 'react';
import { ListMetadataRequestInput } from '../../state/queries';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';

/**
 * TikTok Personal Native taboule query configuration
 *
 * Columns:
 *  - id
 *  - authorId
 *  - videoId
 *  - description
 *  - hashtags
 *  - savingTime
 *  - experimentId
 *  - researchTag
 * Actions:
 *  - download csv
 *
 * @param opts - Taboule query options {@link GetTabouleQueryConfOpts}
 * @returns taboule query configuration for tiktok personal "native" videos
 */
export const tikTokPersonalNative: GetTabouleQueryConf<
  NativeMetadata,
  ListMetadataRequestInput,
  { total: number; content: NativeMetadata[] }
> = ({ clients, commands, params }) => ({
  filters: {
    nature: NativeType.value,
  },
  inputs: inputs.publicKeyInput,
  query: queryStrict(
    ({ Query: { amount, skip, filter, ...query } }) =>
      pipe(
        clients.TK.v2.Metadata.ListMetadata({
          ValidateOutput: false,
          Query: {
            ...query,
            amount,
            skip,
            filter: {
              description: undefined,
              ...filter,
              nature: NativeType.value,
            },
          },
        } as any),
        TE.map((content) => ({
          total: content.totals.native,
          content: content.data.map((d) => ({
            ...d,
            id: d.id ?? '',
          })) as any[] as NativeMetadata[],
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
                  type: NativeType.value,
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
      field: 'authorId',
    },
    {
      ...columnDefault,
      field: 'videoId',
      renderCell: (params) => {
        return <a href="">{params.row.videoId}</a>;
      },
    },
    {
      ...columnDefault,
      field: 'description',
      filterable: true,
    },
    {
      ...columnDefault,
      field: 'hashtags',
      renderCell: (params) => {
        const hashtags = params.row.hashtags ?? [];
        return <span>{hashtags.join(',')}</span>;
      },
    },
    ...fieldsDefaultTail,
  ],
});
