import * as Endpoints from '@backend/endpoints';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme
} from '@material-ui/core';
import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Record';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MinimalEndpointInstance } from 'ts-endpoint';
import { config } from '../../../config';

export const APIList: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Box>
      <Typography color="textPrimary" variant="h5">
        {t('settings:api_list_title')}
      </Typography>
      {pipe(
        Endpoints,
        R.toArray,
        A.map(([apiVersionKey, apiVersionEndpoints]) => {
          return (
            <Box key={apiVersionKey}>
              <Typography color="primary" variant="h5">
                {apiVersionKey}
              </Typography>

              {pipe(
                apiVersionEndpoints as {
                  [key: string]: { [key: string]: MinimalEndpointInstance };
                },
                R.toArray,
                A.map(([apiNamespace, api]) => {
                  return (
                    <Box>
                      <Typography variant="h6">{apiNamespace}</Typography>
                      <List>
                        {pipe(
                          api,
                          R.toArray,
                          A.map(([routeName, endpoint]) => {
                            const params = pipe(
                              endpoint.Input?.Params?.props ?? {},
                              R.mapWithIndex((key) => `:${key}`)
                            );
                            return (
                              <ListItem key={apiNamespace}>
                                <ListItemText>
                                  <Typography
                                    color="primary"
                                    variant="subtitle1"
                                    style={{ marginBottom: theme.spacing(1) }}
                                  >
                                    {routeName}
                                  </Typography>{' '}
                                  <Typography variant="body1">
                                    {endpoint.Method} {config.REACT_APP_API_URL}
                                    {endpoint.getPath(params)}
                                  </Typography>
                                </ListItemText>
                              </ListItem>
                            );
                          })
                        )}
                      </List>
                    </Box>
                  );
                })
              )}
            </Box>
          );
        })
      )}
    </Box>
  );
};
