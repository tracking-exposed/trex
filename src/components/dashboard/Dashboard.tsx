import { AuthResponse } from '@backend/models/Auth';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { auth } from '../../state/creator.queries';
import { CurrentView, currentView } from '../../utils/location.utils';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import Settings from './Settings';
import { StatisticsPage } from './community/StatisticsPage';
import { LinkAccount } from './LinkAccount';
import { Sidebar } from './Sidebar';
import { Studio } from './studio/Studio';
import { StudioVideoEdit } from './studio/StudioVideoEdit';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    width: '100%',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  title: {
    marginBottom: 15,
  },
  subtitle: {
    marginBottom: 20,
  },
}));

interface DashboardContentProps {
  currentView: CurrentView;
  auth: AuthResponse | undefined;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  currentView,
  auth,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const [currentViewLabel, currentViewSubtitle, currentViewContent] =
    React.useMemo(() => {
      switch (currentView.view) {
        case 'settings':
          // eslint-disable-next-line react/jsx-key
          return [t('routes:settings'), '', <Settings />];
        case 'linkAccount':
        case 'studioEdit':
        case 'studio': {
          if (auth === undefined || !auth.verified) {
            return [
              t('routes:link_account'),
              t('link_account:subtitle'),
              // eslint-disable-next-line react/jsx-key
              <LinkAccount auth={auth} />,
            ];
          }

          switch (currentView.view) {
            case 'studioEdit':
              return [
                t('routes:studio'),
                '',
                // eslint-disable-next-line react/jsx-key
                <StudioVideoEdit videoId={currentView.videoId} />,
              ];
            case 'studio':
            default:
              return [
                t('routes:studio'),
                '',
                // eslint-disable-next-line react/jsx-key
                <Studio />,
              ];
          }
        }
        case 'statistics':
        default:
          return [
            t('routes:statistics'),
            t('statistics:subtitle'),
            // eslint-disable-next-line react/jsx-key
            <StatisticsPage />,
          ];
      }
    }, [currentView, auth]);

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

const withQueries = declareQueries({ currentView, auth });

export const Dashboard = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ currentView, auth }) => {
      const classes = useStyles();

      return (
        <Grid container className={classes.root} spacing={3}>
          <Grid item md={3}>
            <Sidebar />
          </Grid>
          <DashboardContent currentView={currentView} auth={auth} />
        </Grid>
      );
    })
  );
});
