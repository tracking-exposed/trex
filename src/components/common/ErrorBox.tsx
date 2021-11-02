import { Card, Grid } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as React from 'react';

export const ErrorBox = (e: unknown): React.ReactElement<any, string> => {
  // eslint-disable-next-line
  console.error(e);
  return (
    <Grid item>
      <Card>
        <Alert severity="error">
          {e instanceof Error ? (
            <>
              <AlertTitle>{e.name ?? 'Error'}</AlertTitle>
              {e.message}
            </>
          ) : typeof e === 'object' ? (
            <>
              <AlertTitle>An object was thrown.</AlertTitle>
              <code>{JSON.stringify(e, null, 2)}</code>
            </>
          ) : <AlertTitle>An unknown error occurred.</AlertTitle>}
        </Alert>
      </Card>
    </Grid>
  );
};
