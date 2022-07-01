import { Card } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';
import { Alert, AlertTitle } from '@material-ui/lab';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import config from '../../../config';
import log from '../../../logger';
import { bo } from '../../../utils/browser.utils';
import { localLookup } from '../../background/sendMessage';
import DashboardLinks, { DashboardLink } from './DashboardLinks';
import InfoBox from './infoBox';
import Settings from './settings';

const styles = {
  width: '400px',
};

export interface PopupProps {
  platform: string;
  logo: string;
  getLinks: (opts: { publicKey: string }) => DashboardLink[];
}
const Popup: React.FC<PopupProps> = ({ platform, getLinks, logo }) => {
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

  const timeAgo = moment.duration(deltaMs).humanize();

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
        <FormHelperText>{platform} — main switch</FormHelperText>
        <Settings {...userSettings} />
        <FormHelperText>Access to your data</FormHelperText>
        <DashboardLinks
          publicKey={userSettings.publicKey}
          getLinks={getLinks}
        />
        <FormHelperText>About</FormHelperText>
        <InfoBox logo={logo} />
      </Card>
      <small>
        version {config.VERSION}, released {timeAgo} ago
      </small>
    </div>
  );
};

export default Popup;
