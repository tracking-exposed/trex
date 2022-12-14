import { Box } from '@mui/material';
import { SearchMetadata } from '@tktrex/shared/models/metadata';
import { SearchType } from '@tktrex/shared/models/Nature';
import { SearchNatureType } from '@yttrex/shared/models/Nature';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import { GetTabouleQueryConf } from '../config.type';
import {
  columnDefault,
  fieldsDefaultHead,
  fieldsDefaultTail,
} from '../defaults';
import * as inputs from '../inputs';

export const tikTokPersonalSearch: GetTabouleQueryConf<SearchMetadata> = (
  commands,
  params
) => ({
  filters: {
    nature: SearchType.value,
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
