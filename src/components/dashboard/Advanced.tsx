import { Endpoints } from '@backend/endpoints/v3';
import React from 'react';
import * as R from 'fp-ts/lib/Record';
import { pipe } from 'fp-ts/lib/function';
import * as A from 'fp-ts/lib/Array';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import { MinimalEndpointInstance } from 'ts-endpoint';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';

const APIList: React.FC = () => {
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

class Advanced extends React.Component {
  render(): JSX.Element {
    return (
      <Box>
        <APIList />

        <Typography variant="h3">API TODOs</Typography>
        <List>
          <ListItem>
            <ListItemText>
              Bling signature verification in creator/register API
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText>
              private key signature in all the creator APIs
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText>RESTful videos/recommendation</ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText>
              Advertising (open data and query methods)
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText>
              Restore existing account (for dump/import your keyrings)
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText>
              Statistics on adoption, similar to{' '}
              <a href="https://youtube.tracking.exposed/impact">
                yttrex impact page
              </a>
              .
            </ListItemText>
          </ListItem>
        </List>

        <Typography variant="body1">
          Excluded from this list, but work in progress: shadowban analysis. At
          the moment it is developed as a separated tool/binary, and we&apos;re
          completing research. It is in alpha stage, and we can discuss more on
          the methodology.
        </Typography>
      </Box>
    );
  }
}

export default Advanced;
