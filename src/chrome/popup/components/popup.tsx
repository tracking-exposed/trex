import { Card, makeStyles } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import { string } from 'fp-ts';
import moment from 'moment';
import React from 'react';
import config from '../../../config';
import InfoBox from './infoBox';
import Settings from './settings';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = (window as any).chrome || (window as any).browser;

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
  publicKey: string;
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
        if (userSettings && userSettings.publicKey) {
          setLocalLookup({ status: 'done', data: userSettings });
        } else {
          setLocalLookup({ status: 'error', data: userSettings });
        }
      });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('catch error', e.message, bo.runtime.lastError);
      setLocalLookup({ status: 'error', data: '' });
    }
  }, []);

  const classes = useStyles();

  const version = config.VERSION;
  const timeago =
    moment
      .duration((moment() as any) - (moment(config.BUILDISODATE) as any))
      .humanize() + ' ago';

  if (!localLookup) {
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
            Extension isn't initialized yet —{' '}
            <strong>
              Access{' '}
              <a href="https://www.youtube.com" target="_blank">
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
        <a target="_blank" href={config.WEB_ROOT} className={classes.link}>
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
