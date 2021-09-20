import { Card, Grid } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as React from 'react';

export const ErrorBox = (e) => {
  // eslint-disable-next-line
  console.error(e);
  return (
    <Grid item>
      <Card>
        <Alert severity="error">
          <AlertTitle>Error {e.name}</AlertTitle>
          {e.message}

          {e ? (
            <div>
              <code>{JSON.stringify(e, null, 2)}</code>
            </div>
          ) : null}
        </Alert>
      </Card>
    </Grid>
  );
};
