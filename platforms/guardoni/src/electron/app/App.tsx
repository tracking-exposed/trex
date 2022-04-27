import { Box, LinearProgress } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router';
import { v4 as uuid } from 'uuid';
import { GuardoniPlatformConfig, Platform } from '../../guardoni/types';
import { EVENTS } from '../models/events';
import { OutputItem } from './components/OutputPanel';
import ExperimentExecutionRoute from './components/ExperimentExecution';
import ExperimentList from './components/ExperimentList';
import Layout from './Layout';

export function a11yProps(index: number): any {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export const TabPanel: React.FC<any> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

export const App: React.FC = () => {
  const history = useHistory();

  const [config, setConfig] = React.useState<
    GuardoniPlatformConfig | undefined
  >(undefined);

  const [outputItems, setOutputItems] = React.useState<OutputItem[]>([]);

  const handleConfigChange = React.useCallback((c: GuardoniPlatformConfig) => {
    setConfig(c);
    ipcRenderer.send(EVENTS.SET_GUARDONI_CONFIG_EVENT.value, c);
  }, []);

  const handlePlatformChange = React.useCallback((p: Platform) => {
    setConfig(undefined);
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
    ipcRenderer.on(EVENTS.GET_GUARDONI_CONFIG_EVENT.value, (event, config) => {
      setConfig(config);
    });

    if (config === undefined) {
      ipcRenderer.send(EVENTS.GET_GUARDONI_CONFIG_EVENT.value);
    }

    return () => {
      ipcRenderer.removeAllListeners(EVENTS.GET_GUARDONI_CONFIG_EVENT.value);
    };
  }, []);

  if (!config) {
    return <LinearProgress />;
  }

  return (
    <Layout
      config={config}
      onConfigChange={handleConfigChange}
      onPlatformChange={handlePlatformChange}
    >
      <Switch>
        <Route
          path="/run/:experimentId"
          render={(props) => (
            <ExperimentExecutionRoute {...props} config={config} />
          )}
        />
        <Route
          path="/experiments"
          render={(props) => <ExperimentList {...props} config={config} />}
        />
        <Redirect from="*" to="/experiments" />
      </Switch>
    </Layout>
  );
};
