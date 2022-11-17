import { Box } from '@mui/material';
import { VideoMetadata as YTVideoMetadata } from '@yttrex/shared/models/metadata/Metadata';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';
import { getApplyFilterFnIncluded } from '../filters';
import { VideoNatureType } from '@yttrex/shared/models/Nature';

export const youtubePersonalVideos: GetTabouleQueryConf<YTVideoMetadata> = (
  commands,
  params
) => ({
  filters: {
    nature: VideoNatureType.value,
  },
  inputs: (params, setParams) => (
    <div>
      {inputs.publicKeyInput(params, setParams)}
      {inputs.experimentIdInput(params, setParams)}
    </div>
  ),
  actions: () => {
    return (
      <Box textAlign={'right'}>
        <CSVDownloadButton
          onClick={() => {
            void commands.downloadAsCSV({
              Params: {
                publicKey: params.publicKey,
                type: 'video',
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
      getApplyQuickFilterFn: getApplyFilterFnIncluded,
    },
    {
      ...columnDefault,
      headerName: 'author',
      field: 'authorName',
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
