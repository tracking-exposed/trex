import { LinearProgress } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router';
import { v4 as uuid } from 'uuid';
import { GuardoniConfig, PlatformConfig, Platform } from '../../guardoni/types';
import { EVENTS } from '../models/events';
import ExperimentExecutionRoute from './components/ExperimentExecution';
import ExperimentList from './components/ExperimentList';
import { OutputItem } from './components/OutputPanel';
import Layout from './Layout';

export const App: React.FC = () => {
  const history = useHistory();

  const [{ config, platform, profiles }, setConfig] = React.useState<{
    config: GuardoniConfig | undefined;
    platform: PlatformConfig | undefined;
    profiles: string[];
  }>({ config: undefined, platform: undefined, profiles: [] });

  const [outputItems, setOutputItems] = React.useState<OutputItem[]>([]);

  const handleConfigChange = React.useCallback((c: GuardoniConfig) => {
    ipcRenderer.send(EVENTS.SET_GUARDONI_CONFIG_EVENT.value, c);
  }, []);

  const handlePlatformChange = React.useCallback((p: Platform) => {
    history.replace({ pathname: '/experiments/list' });
    ipcRenderer.send(EVENTS.CHANGE_PLATFORM_EVENT.value, p);
  }, []);

  React.useEffect(() => {
    // listen for global errors
    ipcRenderer.on(EVENTS.GLOBAL_ERROR_EVENT.value, (event, error) => {
      setOutputItems(
        outputItems.concat({
          id: uuid(),
          level: 'Error',
          ...error,
        })
      );
    });

    // listen for guardoni error
    ipcRenderer.on(EVENTS.GUARDONI_ERROR_EVENT.value, (event, error) => {
      setOutputItems(
        outputItems.concat({
          id: uuid(),
          level: 'Error',
          ...error,
        })
      );
    });
  }, [outputItems]);

  React.useEffect(() => {
    // update state when guardoni config has been received
    ipcRenderer.on(
      EVENTS.GET_GUARDONI_CONFIG_EVENT.value,
      (event, { config, platform, profiles }) => {
        setConfig({ config, platform, profiles });
      }
    );

    if (config === undefined) {
      ipcRenderer.send(EVENTS.GET_GUARDONI_CONFIG_EVENT.value);
    }

    return () => {
      ipcRenderer.removeAllListeners(EVENTS.GET_GUARDONI_CONFIG_EVENT.value);
    };
  }, []);

  if (!config || !platform) {
    return <LinearProgress />;
  }

  return (
    <Layout
      config={config}
      platform={platform}
      profiles={profiles}
      onConfigChange={handleConfigChange}
      onPlatformChange={handlePlatformChange}
    >
      <Switch>
        <Route
          path="/run/:experimentId"
          render={(props) => (
            <ExperimentExecutionRoute {...props} config={platform} />
          )}
        />
        <Route
          path="/experiments"
          render={(props) => <ExperimentList {...props} config={platform} />}
        />
        <Redirect from="*" to="/experiments" />
      </Switch>
    </Layout>
  );
};
