import React from 'react';
import { Grid, Typography, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import { useTranslation } from 'react-i18next';
import { auth, localProfile } from '../../state/dashboard/creator.queries';
import { CurrentView, currentView } from '../../utils/location.utils';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import Settings from './Settings';
import { StatisticsPage } from './community/StatisticsPage';
import { LinkAccount } from './LinkAccount';
import { Sidebar } from './Sidebar';
import { Lab } from './lab/Lab';
import { LabVideoEdit } from './lab/LabVideoEdit';
import { ContentCreator } from '@shared/models/ContentCreator';
import { AuthResponse } from '@shared/models/Auth';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 0,
    width: '100%',
    minHeight: '100%',
    backgroundColor: theme.palette.background.default,
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
  const theme = useTheme();

  const [currentViewLabel, currentViewSubtitle, currentViewContent] =
    React.useMemo(() => {
      switch (currentView.view) {
        case 'settings':
          // eslint-disable-next-line react/jsx-key
          return [t('routes:settings'), '', <Settings />];
        default: {
          if (profile === null) {
            return [
              t('routes:link_account'),
              t('link_account:subtitle'),
              // eslint-disable-next-line react/jsx-key
              <LinkAccount auth={auth} />,
            ];
          }

          switch (currentView.view) {
            case 'labEdit':
              return [
                t('routes:lab_title'),
                t('routes:lab_edit_subtitle'),
                // eslint-disable-next-line react/jsx-key
                <LabVideoEdit videoId={currentView.videoId} />,
              ];
            case 'lab':
              return [
                t('routes:lab_title'),
                t('routes:lab_subtitle'),
                // eslint-disable-next-line react/jsx-key
                <Lab />,
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
    <Grid
      container
      alignContent="flex-start"
      style={{
        minHeight: '100%',
      }}
    >
      <Grid
        item
        xs={12}
        style={{
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography variant="h3" component="h1" color="primary" style={{ whiteSpace: 'pre-line' }}>
          {currentViewLabel}
        </Typography>
        <Typography variant="subtitle1" color="textPrimary">
          {currentViewSubtitle}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        {currentViewContent}
      </Grid>
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
        <Grid container className={classes.root} spacing={4}>
          <Grid item sm={12} md={3} lg={2}>
            <Sidebar currentView={currentView} />
          </Grid>
          <Grid item sm={12} md={9} lg={10}>
            <DashboardContent
              currentView={currentView}
              profile={profile}
              auth={auth}
            />
          </Grid>
        </Grid>
      );
    })
  );
});
