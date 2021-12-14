import React from 'react';
import { Grid, Link, Typography, useTheme, Divider } from '@material-ui/core';
import { ArrowBack as ArrowBackIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import { useTranslation } from 'react-i18next';
import { auth, localProfile } from '../../state/dashboard/creator.queries';
import { CurrentView, currentView, doUpdateCurrentView } from '../../utils/location.utils';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import Settings from './Settings';
import { AnalyticsPage } from './community/AnalyticsPage';
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
  labEditTitle: {
    whiteSpace: 'pre-line',
    paddingTop: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    '& a': {
      color: theme.palette.common.black,
      marginTop: 3,
      marginRight: theme.spacing(1),
      '&:hover': {
        cursor: 'pointer',
      },
    },
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
  const classes = useStyles();

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
                t('routes:analytics'),
                t('analytics:subtitle'),
                // eslint-disable-next-line react/jsx-key
                <AnalyticsPage />,
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
          paddingTop: profile ? 0 : theme.spacing(12),
        }}
      >
        {currentView.view === 'labEdit' ? (
          <Typography
            variant="h3"
            component="h1"
            color= "textSecondary"
            className={classes.labEditTitle}
          >
            <Link
              onClick={doUpdateCurrentView({ view: 'lab' })}
            >
              <ArrowBackIcon />
            </Link>
            {currentViewLabel}
          </Typography>
        ): (
          <Typography
            variant="h3"
            component="h1"
            color= "textSecondary"
            style={{
              whiteSpace: 'pre-line',
              paddingTop: theme.spacing(1),
            }}
          >
            {currentViewLabel}
          </Typography>
        )}

        <Typography variant="subtitle1" color="textPrimary">
          {currentViewSubtitle}
        </Typography>
        <Divider light />
      </Grid>

      <Grid
        item xs={12}
        style={{
          paddingTop: theme.spacing(4),
        }} >
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
            <Sidebar
              currentView={currentView}
              profile={profile}
            />
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
