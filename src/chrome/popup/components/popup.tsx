import { localLookup } from '@chrome/dashboard/API/queries';
import { ErrorBox } from '@chrome/dashboard/components/common/ErrorBox';
import { Card, makeStyles } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { pipe } from 'fp-ts/lib/function';
import moment from 'moment';
import React from 'react';
import config from '../../../config';
import InfoBox from './infoBox';
import Settings from './Settings';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
  },
  container: {
    padding: theme.spacing(2),
  },
  img: {
    width: '100%',
  },
  link: {
    color: 'black',
    textDecoration: 'none',
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

const withQueries = declareQueries({ settings: localLookup });

export const Popup = withQueries(({ queries }) => {
  const classes = useStyles();

  const version = config.VERSION;
  const timeago =
    moment
      .duration((moment() as any) - (moment(config.BUILDISODATE) as any))
      .humanize() + ' ago';

  return pipe(
    queries,
    QR.fold(
      () => (
        <div className={classes.root}>
          <Card className={classes.container}>
            <PopupLoader />
          </Card>
        </div>
      ),
      ErrorBox,
      ({ settings }) => {
        return (
          <div className={classes.root}>
            <Card className={classes.container}>
              <a
                className={classes.link}
                href={config.WEB_ROOT}
                target="_blank"
                rel="noreferrer"
              >
                <img className={classes.img} src="/ycai-logo.png" />
              </a>
              <Settings settings={settings} />
              <InfoBox />
            </Card>
            <small>
              version {version}, released {timeago}
            </small>
          </div>
        );
      }
    )
  );
});
