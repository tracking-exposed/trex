import CommentIcon from '@mui/icons-material/CommentOutlined';
import ShareIcon from '@mui/icons-material/ShareOutlined';
import LikeIcon from '@mui/icons-material/ThumbUpOutlined';
import { Box } from '@mui/material';
import { ForYouMetadata } from '@tktrex/shared/models/metadata';
import { ForYouType } from '@tktrex/shared/models/Nature';
import { available, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import { ListMetadataRequestInput } from '../../state/queries';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';

/**
 * TikTok Personal For You taboule query configuration
 *
 * Columns:
 *  - id
 *  - author
 *  - description
 *  - hashtags
 *  - metrics
 *  - savingTime
 *  - experimentId
 *  - researchTag
 *
 * @param opts - Taboule query options {@link GetTabouleQueryConfOpts}
 * @returns taboule query configuration for tiktok personal "foryou" page
 */
export const tikTokPersonalForYou: GetTabouleQueryConf<
  ForYouMetadata,
  ListMetadataRequestInput
> = ({ clients, commands, params }) => ({
  filters: {
    nature: ForYouType.value,
  },
  inputs: inputs.publicKeyInput,
  query: queryStrict(
    ({ Query: { filter, ...query } }) =>
      pipe(
        clients.TK.v2.Metadata.ListMetadata({
          ValidateOutput: false,
          Query: {
            ...query,
            filter,
          },
        } as any),
        TE.map((content) => ({
          total: content.totals.native,
          content: content.data as any[] as ForYouMetadata[],
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
                  type: ForYouType.value,
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
      field: 'author',
      renderCell: (params) => {
        if (params.formattedValue) {
          return (
            <a
              href={`/search/#${encodeURI(
                params.formattedValue.url as string
              )}`}
            >
              {params.formattedValue.name}
            </a>
          );
        }
        return null;
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
        return params.formattedValue.join(', ');
      },
    },
    {
      ...columnDefault,
      field: 'metrics',
      headerName: 'Like n',
      width: 250,
      renderCell: (params) => {
        return (
          <Box display="flex" flexDirection="row" alignItems="center">
            <Box display="flex" style={{ marginRight: 10 }}>
              <LikeIcon />: {params.value.liken}
            </Box>
            <Box display="flex" style={{ marginRight: 10 }}>
              <CommentIcon />: {params.value.commentn}
            </Box>
            <Box display="flex">
              <ShareIcon />: {params.value.sharen}
            </Box>
          </Box>
        );
      },
    },
    ...fieldsDefaultTail,
  ],
});
