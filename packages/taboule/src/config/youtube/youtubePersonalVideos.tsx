import { Box } from '@mui/material';
import { VideoMetadata as YTVideoMetadata } from '@yttrex/shared/models/metadata/Metadata';
import { VideoNatureType } from '@yttrex/shared/models/Nature';
import { queryStrict, refetch } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
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
import { getApplyFilterFnIncluded } from '../filters';
import * as inputs from '../inputs';

/**
 * YouTube Personal Video taboule query configuration
 *
 * Columns:
 *  - id
 *  - title
 *  - authorName
 *  - viewInfo
 *  - related
 *  - savingTime
 *  - experimentId
 *  - researchTag
 * Expand:
 *  - related
 * Actions:
 *  - download csv
 *
 * @param opts - Taboule query options {@link GetTabouleQueryConfOpts}
 * @returns taboule query configuration for youtube personal "video"
 */
export const youtubePersonalVideos: GetTabouleQueryConf<
  YTVideoMetadata,
  ListMetadataRequestInput
> = ({ clients, commands, params }) => ({
  filters: {
    nature: VideoNatureType.value,
  },
  inputs: (params, setParams) => (
    <div>
      {inputs.publicKeyInput(params, setParams)}
      {inputs.experimentIdInput(params, setParams)}
    </div>
  ),
  query: queryStrict(
    ({ Query: { filter, ...query } }) =>
      pipe(
        clients.YT.v2.Metadata.ListMetadata({
          ValidateOutput: false,
          Query: {
            ...query,
            filter: {
              ...(filter as any),
            },
          },
        } as any),
        TE.map((content) => ({
          total: content.totals.video,
          content: content.data as any[] as YTVideoMetadata[],
        }))
      ),
    refetch
  ),
  expanded({ row, ...props }) {
    return (
      <ExpandView {...props}>
        <ParsedInfoList data={row.related} />
      </ExpandView>
    );
  },
  actions: (filter) => {
    return (
      <Box textAlign={'right'}>
        <CSVDownloadButton
          onClick={() => {
            void commands.ytDownloadAsCSV({
              Query: {
                ...params,
                filter: {
                  ...filter,
                  type: VideoNatureType.value,
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
      field: 'title',
      filterable: true,
      getApplyQuickFilterFn: getApplyFilterFnIncluded,
    },
    {
      ...columnDefault,
      headerName: 'author',
      field: 'authorName',
      filterable: true,
      renderCell: (params) => {
        const authorSource = params.row.authorSource;

        return (
          <a
            href={`https://www.youtube.com${authorSource}`}
            target="_blank"
            rel="noreferrer"
          >
            {params.value}
          </a>
        );
      },
    },
    {
      ...columnDefault,
      field: 'viewInfo',
      headerName: 'Views',
      renderCell: (p) => {
        return p.value.viewNumber;
      },
    },
    {
      ...columnDefault,
      field: 'related',
      renderCell: (params) => {
        if (Array.isArray(params.value)) {
          return params.value.length;
        }
        return 0;
      },
    },
    ...fieldsDefaultTail,
    // {
    //   ...columnDefault,
    //   field: 'actions',
    //   renderCell: actions.personalMetadataActions(commands, params),
    // },
  ],
});
