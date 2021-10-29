import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { auth, localProfile } from '../../state/creator.queries';
import { CurrentView, currentView } from '../../utils/location.utils';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import Settings from './Settings';
import { StatisticsPage } from './community/StatisticsPage';
import { LinkAccount } from './LinkAccount';
import { Sidebar } from './Sidebar';
import { Studio } from './studio/Studio';
import { StudioVideoEdit } from './studio/StudioVideoEdit';
import { ContentCreator } from '@backend/models/ContentCreator';
import { AuthResponse } from '@backend/models/Auth';

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
  profile: ContentCreator | null;
  auth: AuthResponse | null;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  currentView,
  profile,
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
        default: {
          if (profile === null || profile === undefined) {
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
              return [
                t('routes:studio'),
                '',
                // eslint-disable-next-line react/jsx-key
                <Studio />,
              ];
            default:
              return [
                t('routes:statistics'),
                t('statistics:subtitle'),
                // eslint-disable-next-line react/jsx-key
                <StatisticsPage />,
              ];
          }
        }
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

const withQueries = declareQueries({
  currentView,
  profile: localProfile,
  auth,
});

export const Dashboard = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ currentView, profile, auth }) => {
      const classes = useStyles();

      return (
        <Grid container className={classes.root} spacing={3}>
          <Grid item md={3}>
            <Sidebar />
          </Grid>
          <DashboardContent
            currentView={currentView}
            profile={profile}
            auth={auth}
          />
        </Grid>
      );
    })
  );
});
