import { Card, makeStyles } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import moment from 'moment';
import React from 'react';
import config from '../../../config';
import InfoBox from './infoBox';
import Settings from './settings';
import { bo } from '../utils';

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

interface PopupProps {
  publicKey?: string;
}

const Popup: React.FC<PopupProps> = () => {
  const [localLookup, setLocalLookup] = React.useState<
    undefined | { status: string; data: any }
  >();

  React.useEffect(() => {
    try {
      bo.runtime.sendMessage({ type: 'localLookup' }, (userSettings: any) => {
        // eslint-disable-next-line no-console
        console.log('here got', userSettings);
        if ((userSettings?.publicKey) !== undefined) {
          setLocalLookup({ status: 'done', data: userSettings });
        } else {
          setLocalLookup({ status: 'error', data: userSettings });
        }
      });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('catch error', e.message, bo?.runtime.lastError);
      setLocalLookup({ status: 'error', data: '' });
    }
  }, []);

  const classes = useStyles();

  const version = config.VERSION;
  const timeago =
    moment
      .duration((moment() as any) - (moment(config.BUILDISODATE) as any))
      .humanize() + ' ago';

  if (localLookup === undefined) {
    return <div>Loading...</div>;
  }

  if (localLookup.status !== 'done') {
    // eslint-disable-next-line no-console
    console.log('Incomplete info before render');
    return (
      <div className={classes.root}>
        <Card className={classes.container}>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            Extension isn&apos;t initialized yet —{' '}
            <strong>
              Access{' '}
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noreferrer"
              >
                yutube.com
              </a>
              .
            </strong>
          </Alert>
          <InfoBox />
        </Card>
      </div>
    );
  }

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
        <Settings lastSettings={localLookup.data} />
        <InfoBox />
      </Card>
      <small>
        version {version}, released {timeago}
      </small>
    </div>
  );
};

export default Popup;
