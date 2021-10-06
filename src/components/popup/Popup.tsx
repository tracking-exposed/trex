import { updateSettings } from 'API/commands';
import { accountSettings } from 'API/queries';
import { ErrorBox } from '../common/ErrorBox';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  FormControlLabel,
  Grid,
  makeStyles,
  Switch,
  Typography,
} from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { formatDistance } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { config } from '../../config';
import Settings from './Settings';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(2),
    maxWidth: 300,
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
    display: 'block'
  },
  link: {
    color: 'black',
    textDecoration: 'none',
    display: 'block'
  },
}));

const PopupLoader: React.FC = () => {
  return (
    <Alert severity="info">
      <AlertTitle>Loading settings...</AlertTitle>
      <strong>
        Access{' '}
        <a href="https://www.youtube.com" target="_blank" rel="noreferrer">
          yutube.com
        </a>
        .
      </strong>
    </Alert>
  );
};

const withQueries = declareQueries({ settings: accountSettings });

export const Popup = withQueries(({ queries }) => {
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

  return pipe(
    queries,
    QR.fold(
      () => <PopupLoader />,
      ErrorBox,
      ({ settings }) => {
        return (
          <Card className={classes.container}>
            <CardContent className={classes.content}>
              <Grid className={classes.header} container alignItems="center">
                <Grid item sm={8} xs={8}>
                  <a
                    className={classes.link}
                    href={config.REACT_APP_WEB_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img className={classes.img} src="/ycai-logo.png" />
                  </a>
                </Grid>
                <Grid item sm={4} xs={4} alignItems="flex-end" direction="column" alignContent="flex-end">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.active}
                        size="small"
                        color="primary"
                        onChange={(e, c) =>
                          updateSettings({ ...settings, active: c })()
                        }
                      />
                    }
                    label="Enable"
                    labelPlacement="end"
                    style={{ background: 'red' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption">
                    {t('popup:version', { version, date: timeago })}
                  </Typography>
                </Grid>
              </Grid>
              <Divider />
              <Settings settings={settings} />
            </CardContent>

            <CardActions>
              <Button
                size="medium"
                color="primary"
                variant="contained"
                href={'/index.html'}
                target="_blank"
                fullWidth
              >
                {t('dashboard:title')}
              </Button>
            </CardActions>
          </Card>
        );
      }
    )
  );
});
