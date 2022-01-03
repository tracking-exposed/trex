import { Card, CardContent, Typography } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as React from 'react';
import { isAPIError } from '../../errors/APIError';

// todo: add NODE_ENV as parameter
export const ErrorBox = (e: unknown): React.ReactElement<any, string> => {
  // eslint-disable-next-line
  console.log('Displaying error', e);
  return (
    <Card>
      <Alert severity="error">
        <AlertTitle>{e instanceof Error ? e.name : 'Error'}</AlertTitle>
        <p>{e instanceof Error ? e.message : 'Unknown error'}</p>
        {isAPIError(e) ? (
          <ul>
            {(e.details ?? []).map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : null}
      </Alert>

      <CardContent>
        <Typography variant="h6">Debug</Typography>
        <pre style={{ backgroundColor: 'white' }}>
          <code>{JSON.stringify(e, null, 2)}</code>
        </pre>
      </CardContent>
    </Card>
  );
};
