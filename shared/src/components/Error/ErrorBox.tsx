import { Box, Card, CardContent, Typography } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as React from 'react';

// todo: add NODE_ENV as parameter
export const ErrorBox = (e: unknown): React.ReactElement<any, string> => {
  // eslint-disable-next-line
  console.log('Displaying error', e);
  return (
    <Card>
      <Alert severity="error">
        <AlertTitle>{e instanceof Error ? e.name : 'Error'}</AlertTitle>
        <Typography variant="subtitle1">
          {e instanceof Error ? e.message : 'Unknown error'}
        </Typography>
        {Array.isArray((e as any).details) ? (
          <ul>
            {((e as any).details as string[]).map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : null}
      </Alert>

      <CardContent>
        {process.env.NODE_ENV === 'development' ? (
          <Box>
            <Typography variant="h6">Debug</Typography>
            <pre style={{ backgroundColor: 'white' }}>
              <code>{JSON.stringify(e, null, 2)}</code>
            </pre>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};
