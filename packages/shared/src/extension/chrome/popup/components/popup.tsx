import React, { useEffect, useState } from 'react';

import moment from 'moment';

import { Card } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';
import { Alert, AlertTitle } from '@material-ui/lab';
import config from '../../../config';
import log from '../../../logger';
import UserSettings from '../../../models/UserSettings';
import { localLookup } from '../../background/sendMessage';
import GetCSV from './getCSV';
import InfoBox from './infoBox';
import Settings from './settings';

const styles = {
  width: '400px',
};

type PopupState =
  | {
      status: 'loading';
    }
  | {
      status: 'error';
      error: Error;
    }
  | {
      status: 'done';
      payload: UserSettings;
    };

const Popup: React.FC = () => {
  const [userSettingsS, setUserSettingsState] = useState<PopupState>({
    status: 'loading',
  });

  useEffect(() => {
    localLookup(true, (response) => {
      if (response.type === 'Error') {
        setUserSettingsState({
          status: 'error',
          error: response.error,
        });
        log.error('could not get user settings %O', response.error);
        return;
      }
      setUserSettingsState({ status: 'done', payload: response.result });
    });
  }, []);

  const deltaMs = config.BUILD_DATE
    ? Date.now() - new Date(config.BUILD_DATE).getTime()
    : 0;

  const timeAgo = moment.duration(deltaMs).humanize();

  if (userSettingsS.status === 'loading') {
    return (
      <Card style={styles}>
        <Alert severity="info">
          <AlertTitle>Loading</AlertTitle>
          Loading user settings
        </Alert>
      </Card>
    );
  }

  if (userSettingsS.status === 'error') {
    if (
      userSettingsS.error.message ===
      "Error during 'LocalLookup' on codec UserSettings validation"
    ) {
      return (
        <Card style={styles}>
          <Alert severity={'info'}>
            Access to the <a href="https://tiktok.com/">TikTok platform</a>
          </Alert>
        </Card>
      );
    }
    return (
      <Card style={styles}>
        <Alert severity={'error'}>
          <AlertTitle>Error</AlertTitle>
          Something went wrong, sorry.
          <p>
            {userSettingsS.error.name}: {userSettingsS.error.message}
          </p>
        </Alert>
      </Card>
    );
  }

  return (
    <div style={styles}>
      <Card>
        <FormHelperText>TikTok TRex — main switch</FormHelperText>
        <Settings {...userSettingsS.payload} />
        <FormHelperText>Access to your data</FormHelperText>
        <GetCSV publicKey={userSettingsS.payload.publicKey} />
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
