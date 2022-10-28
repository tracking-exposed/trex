import { Card, CardContent, Typography } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as React from 'react';
import { isAPIError } from '../../errors/APIError';

// todo: add NODE_ENV as parameter
export const ErrorBox = (e: unknown): React.ReactElement<any, string> => {
  // eslint-disable-next-line
  console.log('Displaying error', e);
  const errorName = isAPIError(e) ? e.name : 'Error';
  const message = isAPIError(e) ? e.message : 'Unknown Error';
  return (
    <Card>
      <Alert severity="error">
        <AlertTitle>{errorName}</AlertTitle>
        <p>{message}</p>
        {isAPIError(e) && e.details.kind === 'DecodingError' ? (
          <ul>
            {(e.details.errors ?? []).map((d: any) => (
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
