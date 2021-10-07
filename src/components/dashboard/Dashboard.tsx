import { Box, List, ListItem, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import EditIcon from '@material-ui/icons/EditSharp';
import GroupsIcon from '@material-ui/icons/GroupSharp';
import SettingsIcon from '@material-ui/icons/SettingsOutlined';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { accountSettings } from '../../API/queries';
import {
  CurrentView,
  currentView,
  doUpdateCurrentView,
} from '../../utils/location.utils';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import Advanced from './Advanced';
import { CommunityPage } from './community/CommunityPage';
import { LinkAccount } from './LinkAccount';
import { Studio } from './studio/Studio';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
  },
  routesList: {
    marginTop: 100,
  },
  listItem: {
    color: theme.palette.secondary.main,
  },
  listItemIcon: {
    marginRight: 20,
  },
}));

const withQueriesDashboardContent = declareQueries({ accountSettings });
type Q = typeof withQueriesDashboardContent['Props'];

interface DashboardContentProps extends Q {
  currentView: CurrentView;
}

const DashboardContent = withQueriesDashboardContent<DashboardContentProps>(
  ({ queries, currentView }) => {
    return pipe(
      queries,
      QR.fold(LazyFullSizeLoader, ErrorBox, ({ accountSettings }) => {
        const { t } = useTranslation();
        const [currentViewLabel, currentViewSubtitle, currentViewContent] =
          React.useMemo(() => {
            switch (currentView.view) {
              case 'settings':
                // eslint-disable-next-line react/jsx-key
                return [t('routes:settings'), '', <Advanced />];
              case 'studio':
              case 'studioEdit':
                return [
                  t('routes:studio'),
                  '',
                  // eslint-disable-next-line react/jsx-key
                  <Studio currentView={currentView} />,
                ];
              case 'community':
              default:
                return [
                  t('routes:community'),
                  t('community:subtitle'),
                  // eslint-disable-next-line react/jsx-key
                  <CommunityPage
                    channelId={accountSettings.channelCreatorId ?? ''}
                  />,
                ];
            }
          }, [currentView]);

        if (accountSettings.channelCreatorId === null) {
          return <Box>Set channel id</Box>;
        }

        return (
          <Grid item md={9} style={{ padding: 0 }}>
            <Typography variant="h4" color="primary">
              {currentViewLabel}
            </Typography>
            <Typography variant="subtitle1" color="textPrimary">
              {currentViewSubtitle}
            </Typography>
            {currentViewContent}
          </Grid>
        );
      })
    );
  }
);

const withQueries = declareQueries({ currentView: currentView });

export const Dashboard = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ currentView }) => {
      const classes = useStyles();
      const { t } = useTranslation();

      return (
        <Box className={classes.root} padding={2}>
          <Grid container spacing={2}>
            <Grid item md={3}>
              <img alt="YCAI Logo" src="/ycai-logo.png" />

              <LinkAccount />

              <List className={classes.routesList}>
                <ListItem
                  className={classes.listItem}
                  button={true}
                  onClick={doUpdateCurrentView({ view: 'studio' })}
                >
                  <EditIcon className={classes.listItemIcon} />
                  <Typography>{t('routes:studio')}</Typography>
                </ListItem>
                <ListItem
                  className={classes.listItem}
                  button={true}
                  onClick={doUpdateCurrentView({ view: 'community' })}
                >
                  <GroupsIcon className={classes.listItemIcon} />
                  <Typography>{t('routes:community')}</Typography>
                </ListItem>
                <ListItem
                  className={classes.listItem}
                  button={true}
                  onClick={doUpdateCurrentView({ view: 'settings' })}
                >
                  <SettingsIcon className={classes.listItemIcon} />
                  <Typography>{t('routes:settings')}</Typography>
                </ListItem>
              </List>
            </Grid>
            <DashboardContent currentView={currentView} />
          </Grid>
        </Box>
      );
    })
  );
});
