import { Box } from '@mui/material';
import { GuardoniExperiment } from '@shared/models/Experiment';
import { available, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import * as React from 'react';
import * as cells from '../../components/gridCells';
import { SearchRequestInput } from '../../state/queries';
import { GetTabouleQueryConf } from '../config.type';
import { columnDefault } from '../defaults';

export const youtubeGetExperimentList: GetTabouleQueryConf<
  GuardoniExperiment,
  SearchRequestInput
> = ({ clients, params }) => ({
  query: queryStrict(
    (input) =>
      pipe(
        clients.YT.v2.Public.GetExperimentList(input),
        TE.map((content) => {
          return {
            total: content.total,
            content: content.content.map((c) => ({
              ...c,
              id: c.experimentId,
            })) as any[],
          };
        })
      ),
    available
  ),
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
