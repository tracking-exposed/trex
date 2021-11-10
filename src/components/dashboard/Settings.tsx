import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { localProfile } from 'state/creator.queries';
import { keypair, settings } from '../../state/public.queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { AccessTokenBox } from './settings/AccessTokenBox';
import { APIList } from './settings/APIList';
import { KeypairBox } from './settings/KeypairBox';

const withQueries = declareQueries({
  settings,
  keypair,
  profile: localProfile,
});

const Settings = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ settings, keypair, profile }) => {
      return (
        <Box>
          <AccessTokenBox profile={profile} />

          {keypair !== undefined && settings.independentContributions ? (
            <KeypairBox keypair={keypair} settings={settings} />
          ) : null}

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
            Excluded from this list, but work in progress: shadowban analysis.
            At the moment it is developed as a separated tool/binary, and
            we&apos;re completing research. It is in alpha stage, and we can
            discuss more on the methodology.
          </Typography>
        </Box>
      );
    })
  );
});

export default Settings;
