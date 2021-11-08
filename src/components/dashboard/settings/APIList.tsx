import Endpoints from '@backend/endpoints/v3';
import {
    Box, List,
    ListItem,
    ListItemText,
    Typography
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
  return (
    <Box>
      <Typography variant="h3">{t('settings:api_list_title')}</Typography>
      {pipe(
        Endpoints,
        R.toArray,
        A.map(([key, routeEndpoints]) => {
          return (
            <Box key={key}>
              <Typography variant="h5">{key}</Typography>
              <List>
                {pipe(
                  routeEndpoints as { [key: string]: MinimalEndpointInstance },
                  R.toArray,
                  A.map(([routeName, endpoint]) => {
                    const params = pipe(
                      endpoint.Input?.Params?.props ?? {},
                      R.mapWithIndex((key) => `:${key}`)
                    );
                    return (
                      <ListItem key={routeName}>
                        <ListItemText>
                          <Typography variant="subtitle1">
                            {routeName}
                          </Typography>{' '}
                          <Typography variant="body2">
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
      <Typography variant="caption">
        TODO: <a href="https://swagger.io">swagger</a> for all these APIs
      </Typography>
    </Box>
  );
};
