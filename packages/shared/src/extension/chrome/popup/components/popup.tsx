import React, { useState, useEffect } from 'react';

import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import { Card } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import FormHelperText from '@material-ui/core/FormHelperText';

import InfoBox from './infoBox';
import Settings from './settings';
import GetCSV from './getCSV';
import config from '../../../config';
import log from '../../../logger';
import { localLookup } from '../../background/sendMessage';

const bo = chrome;

const styles = {
  width: '400px',
};

const Popup: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading');
  const [userSettings, setUserSettings] = useState<any>(undefined);

  useEffect(() => {
    localLookup((response) => {
      if (response.type === 'Error') {
        setStatus('error');
        log.error('could not get user settings', bo.runtime.lastError);
        return;
      }
      setUserSettings(response.result);
      setStatus('done');
    });
  }, []);

  const deltaMs = config.BUILD_DATE
    ? Date.now() - new Date(config.BUILD_DATE).getTime()
    : 0;

  const timeAgo = formatDistanceToNow(new Date(deltaMs));

  if (status === 'loading') {
    return (
      <Card style={styles}>
        <Alert severity="info">
          <AlertTitle>Loading</AlertTitle>
          Loading user settings
        </Alert>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card style={styles}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          Something went wrong, sorry.
        </Alert>
      </Card>
    );
  }

  return (
    <div style={styles}>
      <Card>
        <FormHelperText>TikTok TRex — main switch</FormHelperText>
        <Settings {...userSettings} />
        <FormHelperText>Access to your data</FormHelperText>
        <GetCSV publicKey={userSettings.publicKey} />
        <FormHelperText>About</FormHelperText>
        <InfoBox />
      </Card>
      <small>
        version {config.VERSION}, released {timeAgo} ago
      </small>
    </div>
  );
};

export default Popup;
