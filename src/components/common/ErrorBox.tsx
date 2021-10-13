import { Card, Grid } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as React from 'react';

export const ErrorBox = (e: unknown): React.ReactElement<any, string> => {
  // eslint-disable-next-line
  console.error(e);
  return (
    <Grid item>
      <Card>
        {e instanceof Error ? (
          <Alert severity="error">
            <AlertTitle>Error {e.name}</AlertTitle>
            {e.message}
          </Alert>
        ) : null}
        {typeof e === 'object' ? (
          <div>
            <code>{JSON.stringify(e, null, 2)}</code>
          </div>
        ) : null}
      </Card>
    </Grid>
  );
};
