import { Box } from '@mui/material';
import { HomeNatureType } from '@yttrex/shared/models/Nature';
import { available, queryStrict } from 'avenger';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as React from 'react';
import CSVDownloadButton from '../../components/buttons/CSVDownloadButton';
import { RequestInputWithPublicKeyParam } from '../../state/queries';
import { GetTabouleQueryConf } from '../config.type';
import { fieldsDefaultHead, fieldsDefaultTail } from '../defaults';
import * as inputs from '../inputs';

export const youtubePersonalStats: GetTabouleQueryConf<
  any,
  RequestInputWithPublicKeyParam
> = ({ clients, commands, params }) => ({
  inputs: (params, setParams) => (
    <div>
      {inputs.publicKeyInput(params, setParams)}
      {inputs.experimentIdInput(params, setParams)}
    </div>
  ),
  filters: {
    nature: HomeNatureType.value,
  },
  query: queryStrict(
    (input) =>
      pipe(
        clients.YT.v1.Public.GetPersonalStatsByPublicKey(input),
        TE.map((content) => ({
          total: content.ads.length,
          content: content.ads,
        }))
      ),
    available
  ),
  actions: ({ filter, ...params }) => {
    return (
      <Box textAlign={'right'}>
        <CSVDownloadButton
          onClick={() => {
            void commands.ytDownloadAsCSV({
              Query: {
                ...params,
                amount: 1000,
                format: 'csv',
                filter: {
                  ...filter,
                  nature: HomeNatureType.value,
                },
              },
            })();
          }}
        />
      </Box>
    );
  },
  columns: [...fieldsDefaultHead, ...fieldsDefaultTail],
});
