import { Box, IconButton, Tooltip } from '@mui/material';
import { GridCellParams } from '@mui/x-data-grid';
import CompareIcon from '@mui/icons-material/CompareOutlined';
import RelatedIcon from '@mui/icons-material/Replay30Outlined';
import * as React from 'react';
import CSVDownloadButton from '../components/buttons/CSVDownloadButton';
import DeleteButton from '../components/buttons/DeleteButton';
import { TabouleCommands } from '../state/commands';

export const personalMetadataActions =
  (commands: TabouleCommands, params: any) =>
  // eslint-disable-next-line react/display-name
  (cellParams: GridCellParams): JSX.Element => {
    return (
      <Box position={'relative'}>
        <DeleteButton
          id={cellParams.row.id}
          onClick={() => {
            void commands.deleteContribution(
              {
                Params: {
                  publicKey: params.publicKey,
                  selector: 'undefined',
                },
              },
              {
                youtubePersonalSearches: {
                  Params: params,
                },
              }
            )();
          }}
        />
        <Tooltip title="Compare" placement="top">
          <IconButton size="small">
            <CompareIcon color="error" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Related" placement="top">
          <IconButton size="small">
            <RelatedIcon color="error" />
          </IconButton>
        </Tooltip>
        <CSVDownloadButton
          onClick={() => {
            void commands.downloadSearchesAsCSV(
              {
                Params: {
                  queryString: cellParams.row.query,
                },
              },
              {
                personalSearch: {
                  Params: params,
                },
              }
            )();
          }}
        />
      </Box>
    );
  };
