import {
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
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
    marginBottom: theme.spacing(2),
  },
  img: {
    width: '100%',
    maxWidth: 200,
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
      <Grid className={classes.header} container alignItems="center">
        <Grid item xs={7}>
          <a
            className={classes.link}
            href={config.REACT_APP_WEB_URL}
            target="_blank"
            rel="noreferrer"
          >
            <img className={classes.img} src="/ycai-logo.png" />
          </a>
        </Grid>
      </Grid>

      <WithQueries
        queries={{ settings }}
        render={QR.fold(
          () => (
            <PopupLoader />
          ),
          PopupErrorBox,
          ({ settings }): any => {
            const content = (
              <CardContent className={classes.content}>
                <Grid key="app-version" item xs={12}>
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
                      }}
                    >
                      {' '}
                      DEVELOPMENT
                    </Typography>
                  ) : null}
                </Grid>

                <Settings key="settings" settings={settings} />
              </CardContent>
            );

            const actions = (
              <CardActions key="actions">
                <Button
                  size="medium"
                  color={'grey[500]' as any}
                  variant="contained"
                  href={'/index.html'}
                  target="_blank"
                  fullWidth
                >
                  {t('dashboard:title')}
                </Button>
              </CardActions>
            );

            return [content, actions];
          }
        )}
      />
      {/* </Grid> */}
    </Card>
  );
};
