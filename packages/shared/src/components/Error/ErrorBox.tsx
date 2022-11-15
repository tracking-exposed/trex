import { Card } from '@material-ui/core';
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
    <Card style={{ height: '100%' }}>
      <Alert severity="error" style={{ height: '50%' }}>
        <AlertTitle>{errorName}</AlertTitle>
        <p>{message}</p>
        {isAPIError(e) && e.details?.kind === 'DecodingError' ? (
          <div style={{ overflow: 'auto', height: '100%' }}>
            <ul>
              {((e.details.errors as any[]) ?? []).map((d: any) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Alert>
    </Card>
  );
};
