import { Box } from '@mui/material';
import { ProfileMetadata } from '@tktrex/shared/models/metadata';
import { ProfileType } from '@tktrex/shared/models/Nature';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import * as cells from '../../components/gridCells';
import { GetTabouleQueryConf } from '../config.type';
import { columnDefault, fieldsDefaultHead, fieldsDefaultTail } from '../defaults';
import * as inputs from '../inputs';

export const tikTokPersonalProfile: GetTabouleQueryConf<ProfileMetadata> = (
  commands,
  params
) => ({
  filters: {
    nature: ProfileType.value
  },
  inputs: inputs.publicKeyInput,
  actions: () => {
    return (
      <Box textAlign={'right'}>
        <CSVDownloadButton
          onClick={() => {
            void commands.downloadAsCSV({
              Params: {
                publicKey: params.publicKey,
                type: 'search',
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
    ...fieldsDefaultTail
  ],
});
