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
import {
  CurrentView,
  currentView,
  doUpdateCurrentView,
} from '../../utils/location.utils';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import Advanced from './Advanced';
import { AuthBox } from './AuthBox';
import { CommunityPage } from './community/CommunityPage';
import { Studio } from './studio/Studio';
import { StudioVideoEdit } from './studio/StudioVideoEdit';
import { UserProfileBox } from './UserProfileBox';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
  },
  title: {
    marginBottom: 15,
  },
  subtitle: {
    marginBottom: 20,
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

interface DashboardContentProps {
  currentView: CurrentView;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ currentView }) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const getAuthBoxView = React.useCallback(() => {
    return [
      t('routes:link_account'),
      t('link_account:subtitle'),
      // eslint-disable-next-line react/jsx-key
      <Grid item md={4}>
        <AuthBox />
      </Grid>,
    ];
  }, []);

  const [currentViewLabel, currentViewSubtitle, currentViewContent] =
    React.useMemo(() => {
      switch (currentView.view) {
        case 'settings':
          // eslint-disable-next-line react/jsx-key
          return [t('routes:settings'), '', <Advanced />];
        case 'studio':
          return [
            t('routes:studio'),
            '',
            // eslint-disable-next-line react/jsx-key
            <AuthBox>
              <Studio />
            </AuthBox>,
          ];
        case 'studioEdit':
          return [
            t('routes:studio'),
            '',
            // eslint-disable-next-line react/jsx-key
            <AuthBox>
              <StudioVideoEdit videoId={currentView.videoId} />
            </AuthBox>,
          ];
        case 'linkAccount':
          return getAuthBoxView();
        case 'community':
        default:
          return [
            t('routes:community'),
            t('community:subtitle'),
            // eslint-disable-next-line react/jsx-key
            <CommunityPage />,
          ];
      }
    }, [currentView]);

  return (
    <Grid item md={9} style={{ padding: 0 }}>
      <Typography variant="h4" color="primary" className={classes.title}>
        {currentViewLabel}
      </Typography>
      <Typography
        variant="subtitle1"
        color="textPrimary"
        className={classes.subtitle}
      >
        {currentViewSubtitle}
      </Typography>
      {currentViewContent}
    </Grid>
  );
};

const withQueries = declareQueries({ currentView });

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
              <img
                alt="YCAI Logo"
                src="/ycai-logo.png"
                onClick={() => {
                  void doUpdateCurrentView({ view: 'index' })();
                }}
              />

              <UserProfileBox />

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
