import { GuardoniExperiment } from '@shared/models/Experiment';
import { TabouleCommands } from '../../state/commands';
import * as cells from '../../components/gridCells';
import { TabouleQueryConfiguration } from '../config.type';
import { columnDefault } from '../defaults';
import * as React from 'react';
import { Box } from '@mui/material';

export const youtubeGetExperimentList = (
  commmands: TabouleCommands,
  params: any
): TabouleQueryConfiguration<GuardoniExperiment> => ({
  columns: [
    {
      ...columnDefault,
      field: 'experimentId',
      headerName: 'experimentId',
      minWidth: 400,
    },
    {
      ...columnDefault,
      field: 'when',
      headerName: 'Registered',
      renderCell: cells.distanceFromNowCell,
    },
    {
      ...columnDefault,
      field: 'steps',
      minWidth: 350,
      renderCell: (params) => {
        return (
          <Box key={params.id}>
            {((params?.value as any[]) || []).map((linkinfo) => {
              return <a href={linkinfo.url}>{linkinfo.urltag}</a>;
            })}
          </Box>
        );
      },
    },
  ],
});
