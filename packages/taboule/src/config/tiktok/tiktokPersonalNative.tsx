import { Box } from '@mui/material';
import { NativeMetadata } from '@tktrex/shared/models/metadata';
import { NativeType } from '@tktrex/shared/models/Nature';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import * as React from 'react';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';

export const tikTokPersonalNative: GetTabouleQueryConf<NativeMetadata> = (
  commands,
  params
) => ({
  filters: {
    nature: NativeType.value,
  },
  inputs: inputs.publicKeyInput,
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
