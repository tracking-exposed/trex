import { Box, Grid } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { localProfile } from '../../state/dashboard/creator.queries';
import { keypair, settings } from '../../state/dashboard/public.queries';
import { ErrorBox } from '@trex/shared/components/Error/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { AccessTokenBox } from './settings/AccessTokenBox';
import { KeypairBox } from './settings/KeypairBox';
import { Swagger } from './settings/Swagger';

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
              {keypair && settings?.independentContributions.enable && (
                <KeypairBox keypair={keypair} settings={settings} />
              )}
            </Grid>
          </Grid>
          <Box style={{ paddingBottom: 100 }}>
            <Swagger />
          </Box>
        </Box>
      );
    })
  );
});

export default Settings;
