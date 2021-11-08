import {
  Button,
  Card,
  CardActions,
  CardContent,
  FormControlLabel,
  Grid,
  makeStyles,
  Switch,
  Typography
} from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { formatDistance } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { pipe } from 'fp-ts/lib/function';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';
import { updateSettings } from '../../state/public.commands';
import { getDefaultSettings } from '../../models/Settings';
import { settings } from '../../state/public.queries';
import { ErrorBox } from '../common/ErrorBox';
import Settings from './Settings';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
    padding: theme.spacing(2),
    boxSizing: 'border-box',
    maxWidth: 400,
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

const withQueries = declareQueries({ settings });

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

                <Grid item xs={4}>
                  <FormControlLabel
                    className={classes.switchFormControl}
                    control={
                      <Switch
                        color="primary"
                        checked={settings?.active ?? false}
                        size="small"
                        onChange={(e, c) =>
                          updateSettings({
                            ...(settings ?? getDefaultSettings()),
                            active: c,
                          })()
                        }
                      />
                    }
                    label="Enable"
                    labelPlacement="end"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption">
                    {t('popup:version', { version, date: timeago })}
                  </Typography>
                </Grid>
              </Grid>

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
