import React from 'react';
import {
  Grid,
  Link,
  Typography,
  useTheme,
  Divider,
  Box,
} from '@material-ui/core';
import { ArrowBack as ArrowBackIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import { useTranslation } from 'react-i18next';
import {
  accountLinkCompleted,
  auth,
  localProfile,
} from '../../state/dashboard/creator.queries';
import {
  CurrentView,
  currentView,
  doUpdateCurrentView,
} from '../../utils/location.utils';
import { ErrorBox } from '@shared/components/Error/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import Settings from './Settings';
import { AnalyticsPage } from './community/AnalyticsPage';
import { LinkAccount } from './LinkAccount';
import { Sidebar } from './Sidebar';
import { Lab } from './lab/Lab';
import { LabVideoEdit } from './lab/LabVideoEdit';
import { ContentCreator } from '@shared/models/ContentCreator';
import { AuthResponse } from '@shared/models/Auth';
import GemCollection from './lab/GemCollection';
import Congrats from './account/congrats';
import HelperPopover from '../common/HelperPopover';

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
  congratsTitle: {
    whiteSpace: 'pre-line',
    paddingTop: theme.spacing(10),
    fontSize: theme.spacing(5),
    fontWeight: theme.typography.h1.fontWeight,
    lineHeight: 1.4,
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
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
  accountLinkCompleted: boolean;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  currentView,
  profile,
  auth,
  accountLinkCompleted,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const classes = useStyles();

  const [
    currentViewLabel,
    currentViewSubtitle,
    helperText,
    currentViewContent,
  ] = React.useMemo(() => {
    switch (currentView.view) {
      case 'settings':
        // eslint-disable-next-line react/jsx-key
        return [t('routes:settings'), '', null, <Settings />];
      default: {
        if (profile === null) {
          return [
            t('routes:link_account'),
            t('link_account:subtitle'),
            null,
            // eslint-disable-next-line react/jsx-key
            <LinkAccount auth={auth} />,
          ];
        }

        if (!accountLinkCompleted) {
          return [
            t('routes:congrats'),
            t('congrats:subtitle'),
            null,
            <Congrats profile={profile} />,
          ];
        }

        switch (currentView.view) {
          case 'labEdit':
            return [
              t('routes:lab_edit_title'),
              t('routes:lab_edit_subtitle'),
              null,
              // eslint-disable-next-line react/jsx-key
              <LabVideoEdit videoId={currentView.videoId} />,
            ];
          case 'lab':
            return [
              t('routes:lab_title'),
              t('routes:lab_subtitle'),
              t('routes:lab_helper'),
              // eslint-disable-next-line react/jsx-key
              <Lab />,
            ];
          case 'analytics':
            return [
              t('routes:analytics_title'),
              t('routes:analytics_subtitle'),
              t('routes:analytics_helper_text'),
              // eslint-disable-next-line react/jsx-key
              <AnalyticsPage />,
            ];
          case 'gemCollection':
          default:
            return [
              t('routes:gem_collection_title'),
              t('routes:gem_collection_subtitle'),
              t('routes:gem_collection_helper_text'),
              // eslint-disable-next-line react/jsx-key
              <GemCollection />,
            ];
        }
      }
    }
  }, [currentView, profile, accountLinkCompleted, auth]);

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
            color="textSecondary"
            className={classes.labEditTitle}
          >
            <Link onClick={doUpdateCurrentView({ view: 'lab' })}>
              <ArrowBackIcon />
            </Link>
            {currentViewLabel}
          </Typography>
        ) : !accountLinkCompleted ? (
          <Typography
            component="h1"
            color="primary"
            className={classes.congratsTitle}
          >
            {currentViewLabel}
          </Typography>
        ) : (
          <Typography
            variant="h3"
            component="h1"
            color="textSecondary"
            style={{
              whiteSpace: 'pre-line',
              paddingTop: theme.spacing(1),
            }}
          >
            {currentViewLabel}
          </Typography>
        )}
        <Box display="flex" alignItems="center">
          <Typography
            display="inline"
            variant="subtitle1"
            color="textPrimary"
            gutterBottom={true}
            style={{
              marginRight: theme.spacing(1),
              marginBottom: theme.spacing(2),
            }}
          >
            {currentViewSubtitle}
          </Typography>
          {helperText ? <HelperPopover text={helperText} /> : null}
        </Box>

        <Divider light />
      </Grid>

      <Grid
        item
        xs={12}
        style={{
          paddingTop: theme.spacing(4),
        }}
      >
        {currentViewContent}
      </Grid>
    </Grid>
  );
};

const withQueries = declareQueries({
  currentView,
  profile: localProfile,
  auth,
  accountLinkCompleted,
});

export const Dashboard = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(
      LazyFullSizeLoader,
      ErrorBox,
      ({ currentView, profile, auth, accountLinkCompleted }) => {
        const classes = useStyles();

        return (
          <Grid container className={classes.root} spacing={4}>
            <Grid item sm={12} md={3} lg={2}>
              <Sidebar
                currentView={currentView}
                accountLinkCompleted={accountLinkCompleted}
                profile={profile}
              />
            </Grid>
            <Grid item sm={12} md={9} lg={10}>
              <DashboardContent
                currentView={currentView}
                profile={profile}
                auth={auth}
                accountLinkCompleted={accountLinkCompleted}
              />
            </Grid>
          </Grid>
        );
      }
    )
  );
});
