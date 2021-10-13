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
                            {endpoint.Method} {endpoint.getPath(params)}
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
};

class Advanced extends React.Component {
  render(): JSX.Element {
    return (
      <div>
        <h3>
          TODO: <a href="https://swagger.io">swagger</a> for all these APIs
        </h3>
        <hr />
        <APIList />
        <h2>Public API</h2>
        <ol>
          <li>
            <code>(youchoose.ai|localhost:9000)/api/v3/handshake</code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/video/:videoId/recommendations
            </code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/recommendations/:ids
            </code>
          </li>
        </ol>

        <h2>Creator (authenticated) API</h2>

        <ol>
          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/creator/updateVideo
            </code>
          </li>

          <li>
            <code>(youchoose.ai|localhost:9000)/api/v3/creator/ogp</code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/creator/videos/:publicKey
            </code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/creator/recommendations/:publicKey
            </code>
          </li>

          <li>
            <code>
              (youchoose.ai|localhost:9000)/api/v3/creator/register/:channelId
            </code>
          </li>
        </ol>

        <h2>Existing API from our previously developed backend</h2>

        <ol>
          <li>
            <code>
              (youtube.tracking.exposed|localhost:9000)/api/v2/compare/:videoId
            </code>
          </li>

          <li>
            <code>
              (youtube.tracking.exposed|localhost:9000)/api/v2/related/:videoId
            </code>
          </li>

          <li>
            <code>
              (youtube.tracking.exposed|localhost:9000)/api/v2/author/:videoId
            </code>
          </li>

          <li>
            <code>
              (youtube.tracking.exposed|localhost:9000)/api/v2/searches/:queryString
            </code>
          </li>
        </ol>

        <h2>API TODOs</h2>
        <ol>
          <li>Bling signature verification in creator/register API</li>
          <li>private key signature in all the creator APIs</li>
          <li>RESTful videos/recommendation</li>
          <li>Advertising (open data and query methods)</li>
          <li>Restore existing account (for dump/import your keyrings)</li>
          <li>
            Statistics on adoption, similar to{' '}
            <a href="https://youtube.tracking.exposed/impact">
              yttrex impact page
            </a>
            .
          </li>
        </ol>

        <p>
          Excluded from this list, but work in progress: shadowban analysis. At
          the moment it is developed as a separated tool/binary, and we&apos;re
          completing research. It is in alpha stage, and we can discuss more on
          the methodology.
        </p>
      </div>
    );
  }
}

export default Advanced;
