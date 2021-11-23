import {
  Box,
  Grid
} from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { localProfile } from 'state/creator.queries';
import { keypair, settings } from '../../state/public.queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { AccessTokenBox } from './settings/AccessTokenBox';
import { APIList } from './settings/APIList';
import { KeypairBox } from './settings/KeypairBox';

const withQueries = declareQueries({
  settings,
  keypair,
  profile: localProfile,
});

const Settings = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ settings, keypair, profile }) => {
      return (
        <Box>
          <Grid container>
            <Grid item xs={12} lg={6}>
              <AccessTokenBox profile={profile} />
            </Grid>
          </Grid>
          {keypair !== undefined && settings.independentContributions ? (
            <KeypairBox keypair={keypair} settings={settings} />
          ) : null}

          <Box style={{ paddingBottom: 100 }}>
            <APIList />
          </Box>
        </Box>
      );
    })
  );
});

export default Settings;
