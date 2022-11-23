import ShareIcon from '@mui/icons-material/ShareOutlined';
import LikeIcon from '@mui/icons-material/ThumbUpOutlined';
import CommentIcon from '@mui/icons-material/CommentOutlined';
import { Box } from '@mui/material';
import { ForYouMetadata } from '@tktrex/shared/models/metadata';
import { ForYouType } from '@tktrex/shared/models/Nature';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';

export const tikTokPersonalForYou: GetTabouleQueryConf<ForYouMetadata> = (
  commands,
  params
) => ({
  filters: {
    nature: ForYouType.value,
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
