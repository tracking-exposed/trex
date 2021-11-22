import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as QR from 'avenger/lib/QueryResult';
import { WithQueries } from 'avenger/lib/react';
import { formatDistance } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';
import { settings } from '../../state/public.queries';
import { PopupErrorBox } from './PopupErrorBox';
import Settings from './Settings';

const useStyles = makeStyles((theme) => ({
  container: {
    width: 500,
    padding: theme.spacing(2),
    boxSizing: 'border-box',
  },
  content: {
    marginBottom: theme.spacing(2),
  },
  header: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(0),
  },
  version:{
    marginBottom: theme.spacing(7),
  },
  img: {
    width: '280%',
    maxWidth: 280,
    display: 'block',
  },
  link: {
    color: 'black',
    textDecoration: 'none',
    display: 'block',
  },
  switchFormControl: {
    margin: 0,
  },
  dashboardButton: {
    backgroundColor: theme.palette.common.black,
    padding: theme.spacing(3),
    '& span': {
      lineHeight: 1,
    },
  },
}));

const PopupLoader: React.FC = () => {
  return (
    <Alert severity="info">
      <AlertTitle>Loading settings...</AlertTitle>
      <strong>
        Access{' '}
        <a href="https://www.youtube.com" target="_blank" rel="noreferrer">
          youtube.com
        </a>
        .
      </strong>
    </Alert>
  );
};

export const Popup: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();

  const version = config.REACT_APP_VERSION;
  const timeago = formatDistance(
    parseISO(config.REACT_APP_BUILD_DATE),
    new Date(),
    {
      addSuffix: true,
    }
  );

  return (
    <Card className={classes.container}>
      <Box
        className={classes.header}
        display="flex"
        justifyContent="center"
      >
        <a
          className={classes.link}
          href={config.REACT_APP_WEB_URL}
          target="_blank"
          rel="noreferrer"
        >
          <img className={classes.img} src="/ycai-logo.svg" />
        </a>
      </Box>

      <WithQueries
        queries={{ settings }}
        render={QR.fold(
          () => (
            <PopupLoader />
          ),
          PopupErrorBox,
          ({ settings }): any => (
            <>
              <CardContent className={classes.content}>
                <Box
                  className={classes.version}
                  alignItems="center"
                  display="flex"
                  justifyContent="center"
                >
                  <Typography variant="caption">
                    {t('popup:version', { version, date: timeago })}
                  </Typography>
                  {config.NODE_ENV === 'development' ? (
                    <Typography
                      color="primary"
                      variant="subtitle1"
                      display="inline"
                      style={{
                        fontWeight: 800,
                        marginBottom: 0,
                      }}
                    >
                      &nbsp;DEVELOPMENT
                    </Typography>
                  ) : null}
                </Box>

                <Settings settings={settings} />
              </CardContent>
              <CardActions>
                <Button
                  className={classes.dashboardButton}
                  color="primary"
                  fullWidth
                  href={'/index.html'}
                  size="large"
                  target="_blank"
                  variant="contained"
                >
                  {t('dashboard:title')}
                </Button>
              </CardActions>
            </>
          )
        )}
      />
      {/* </Grid> */}
    </Card>
  );
};
