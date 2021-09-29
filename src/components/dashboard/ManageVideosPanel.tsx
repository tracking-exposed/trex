import { Button, Grid } from '@material-ui/core';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { updateSettings } from '../../API/commands';
import { accountSettings } from '../../API/queries';
import { CreatorVideos } from './CreatorVideos';
import { CurrentVideoOnEdit } from './CurrentVideoOnEdit';
import Fetcher from './Fetcher';
import { Recommendations } from './Recommendations';
import * as QR from 'avenger/lib/QueryResult';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { ErrorBox } from '../../components/common/ErrorBox';

const withQueries = declareQueries({ accountSettings });

export const ManageVideosPanel = withQueries(
  ({ queries }): React.ReactElement => {
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ accountSettings }) => (
        <Grid container spacing={3}>
          <Grid item md={4}>
            <h4>Your videos:</h4>
            <Button
              onClick={async () =>
                await updateSettings({
                  ...accountSettings,
                  edit: null,
                })()
              }
            >
              Clear
            </Button>
            <CreatorVideos
              onVideoClick={async (v) => {
                await updateSettings({
                  ...accountSettings,
                  edit: v,
                })();
              }}
            />
          </Grid>
          <Grid item md={4}>
            <Fetcher />
            <Recommendations />
          </Grid>
          <Grid item md={4}>
            <CurrentVideoOnEdit />
          </Grid>
        </Grid>
      ))
    );
  }
);
