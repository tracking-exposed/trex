import { Card, CardContent, Grid, Typography } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import { config } from 'config';
import { APIError } from 'providers/api.provider';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const ErrorBox = (e: unknown): React.ReactElement<any, string> => {
  // eslint-disable-next-line
  console.error(e);
  const { t } = useTranslation();
  return (
    <Grid item>
      <Card>
        <Alert severity="error">
          {e instanceof Error || e instanceof APIError ? (
            <>
              <AlertTitle>{e.name ?? 'Error'}</AlertTitle>
              <p>{e.message}</p>
              {e instanceof APIError ? (
                <ul>
                  {(e.details ?? []).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <>
              <AlertTitle>{t('errors:an_error_occurred')}</AlertTitle>
            </>
          )}
        </Alert>
        {config.NODE_ENV === 'development' ? (
          <CardContent>
            <Typography variant="h6">Debug</Typography>
            <pre style={{ backgroundColor: 'white' }}>
              <code>{JSON.stringify(e, null, 2)}</code>
            </pre>
          </CardContent>
        ) : null}
      </Card>
    </Grid>
  );
};
