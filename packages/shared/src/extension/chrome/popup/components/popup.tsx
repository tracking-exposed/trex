import { Card } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';
import { Alert, AlertTitle } from '@material-ui/lab';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import config from '../../../config';
import log from '../../../logger';
import UserSettings from '../../../models/UserSettings';
import { configUpdate, localLookup } from '../../background/sendMessage';
import DashboardLinks, { DashboardLink } from './DashboardLinks';
import InfoBox from './infoBox';
import Settings, { SettingsProps } from './settings';

const styles = {
  width: '400px',
};

export interface PopupProps {
  platform: string;
  platformURL: string;
  logo: string;
  getLinks: (opts: { publicKey: string }) => DashboardLink[];
  settings: Pick<SettingsProps, 'enabled'>
}

type PopupState =
  | { status: 'init' }
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

let localLookupInterval: any;
const Popup: React.FC<PopupProps> = ({
  platform,
  platformURL,
  settings,
  logo,
  getLinks,
}) => {
  const [userSettingsS, setUserSettingsState] = useState<PopupState>({
    status: 'init',
  });

  const handleLocalLookup = (): void => {
    localLookup(true, (response) => {
      if (response.type === 'Error') {
        setUserSettingsState({
          status: 'error',
          error: response.error,
        });
        log.error('could not get user settings %O', response.error);

        // localLookupInterval = setTimeout(() => {
        //   log.info('Refetching settings...');
        //   handleLocalLookup();
        // }, 2000);
        return;
      }

      if (localLookupInterval) {
        localLookupInterval.clear();
        localLookupInterval = undefined;
      }

      setUserSettingsState({ status: 'done', payload: response.result });
    });
  };

  const handleConfigChange = React.useCallback((s: UserSettings): void => {
    configUpdate(s, (r) => {
      if (r.type === 'Error') {
        setUserSettingsState({
          status: 'error',
          error: r.error,
        });
      } else {
        setUserSettingsState({
          status: 'done',
          payload: r.result,
        });
      }
    });
  }, []);

  useEffect(() => {
    if (userSettingsS.status === 'init') {
      handleLocalLookup();
    }
  }, []);

  const deltaMs = config.BUILD_DATE
    ? Date.now() - new Date(config.BUILD_DATE).getTime()
    : 0;

  const timeAgo = moment.duration(deltaMs).humanize();

  const content = React.useMemo(() => {
    if (userSettingsS.status === 'loading' || userSettingsS.status === 'init') {
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
              Access to{' '}
              <a
                target="_blank"
                href="https://tiktok.com/"
                rel="noreferrer"
                // onClick={() => startUserSettingsListener()}
              >
                TikTok
              </a>
              .
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
      <Card>
        <FormHelperText>TikTok TRex — main switch</FormHelperText>
        <Settings
        enabled={settings.enabled}
          settings={userSettingsS.payload}
          onSettingsChange={handleConfigChange}
        />
        <FormHelperText>Access to your data</FormHelperText>
        <DashboardLinks
          publicKey={userSettingsS.payload.publicKey}
          getLinks={getLinks}
        />
        <FormHelperText>About</FormHelperText>
        <InfoBox logo={logo} />
      </Card>
    );
  }, [userSettingsS]);

  return (
    <div style={styles}>
      {content}
      <small>
        version {config.VERSION}, released {timeAgo} ago
      </small>
    </div>
  );
};

export default Popup;
