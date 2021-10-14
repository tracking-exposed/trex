import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CurrentView, currentView } from '../../utils/location.utils';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import Advanced from './Advanced';
import { AuthBox } from './AuthBox';
import { Sidebar } from './Sidebar';
import { StatisticsPage } from './community/StatisticsPage';
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
        case 'statistics':
        default:
          return [
            t('routes:statistics'),
            t('statistics:subtitle'),
            // eslint-disable-next-line react/jsx-key
            <StatisticsPage />,
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

      return (
        <Grid container className={classes.root} spacing={3}>
          <Grid item md={3}>
            <Sidebar />
          </Grid>
          <DashboardContent currentView={currentView} />
        </Grid>
      );
    })
  );
});
