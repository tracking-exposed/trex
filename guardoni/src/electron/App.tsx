import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  Input,
  LinearProgress,
  makeStyles,
  Tab,
  Tabs,
  Typography,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { v4 as uuid } from 'uuid';
import { GuardoniConfig } from '../guardoni/types';
import {
  GET_GUARDONI_CONFIG_EVENT,
  GLOBAL_ERROR_EVENT,
  GUARDONI_ERROR_EVENT,
  GUARDONI_OUTPUT_EVENT,
  OPEN_GUARDONI_DIR,
  RUN_GUARDONI_EVENT,
} from './models/events';
import OutputPanel, { OutputItem } from './OutputPanel';
import { AutoRunTab } from './tabs/AutoRunTab';
import { FromCSVFileTab } from './tabs/FromCSVFileTab';
import { FromURLsTab } from './tabs/FromURLsTab';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
    height: '100%',
  },
  formGroup: {
    margin: theme.spacing(2),
  },
  formControl: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    margin: 0,
  },
  formControlCheckbox: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: 0,
  },
  formControlWithMarginBottom: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    margin: 0,
    marginBottom: theme.spacing(4),
  },
  formHelperText: {
    marginBottom: theme.spacing(4),
  },
}));

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

const runGuardoni = (config: GuardoniConfig, experimentId: string): void => {
  ipcRenderer.send(RUN_GUARDONI_EVENT.value, config, experimentId);
};

export const App: React.FC = () => {
  const classes = useStyles();
  const [tab, setTab] = React.useState(0);
  const [config, setConfig] = React.useState<GuardoniConfig | undefined>(
    undefined
  );

  const [outputItems, setOutputItems] = React.useState<OutputItem[]>([]);

  const handleOpenProfileDir = React.useCallback((config: GuardoniConfig) => {
    void ipcRenderer.send(OPEN_GUARDONI_DIR.value, config.profileName);
  }, []);

  React.useEffect(() => {
    // listen for global errors
    ipcRenderer.on(GLOBAL_ERROR_EVENT.value, (event, error) => {
      setOutputItems(
        outputItems.concat({
          id: uuid(),
          level: 'Error',
          ...error,
        })
      );
    });
    // listen for guardoni error
    ipcRenderer.on(GUARDONI_ERROR_EVENT.value, (event, error) => {
      setOutputItems(
        outputItems.concat({
          id: uuid(),
          level: 'Error',
          ...error,
        })
      );
    });

    // update guardoni output when proper event is received
    ipcRenderer.on(GUARDONI_OUTPUT_EVENT.value, (event, output) => {
      setOutputItems(outputItems.concat(output));
    });
  }, [outputItems]);

  React.useEffect(() => {
    // update state when guardoni config has been received
    ipcRenderer.on(GET_GUARDONI_CONFIG_EVENT.value, (event, config) => {
      setConfig(config);
    });

    // request guardoni config
    ipcRenderer.send(GET_GUARDONI_CONFIG_EVENT.value);

    return () => {
      ipcRenderer.removeAllListeners(GET_GUARDONI_CONFIG_EVENT.value);
    };
  }, []);

  if (!config) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box style={{ marginBottom: 20 }}>
        <Typography variant="h3">Guardoni</Typography>
        <Typography variant="caption">
          v{process.env.VERSION} - {process.env.NODE_ENV}
        </Typography>
      </Box>
      <Grid container spacing={2} className={classes.container}>
        <Grid item lg={8} md={8} sm={6}>
          <FormGroup className={classes.formGroup}>
            <Grid container style={{ marginBottom: 40 }}>
              <Grid item md={6}>
                <FormControlLabel
                  label="Profile"
                  className={classes.formControl}
                  labelPlacement="top"
                  control={
                    <Input
                      id="profile-path"
                      aria-describedby="profile-path-text"
                      value={config.profileName}
                      fullWidth
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          profileName: e.target.value,
                        })
                      }
                    />
                  }
                />
                <FormHelperText className={classes.formHelperText}>
                  The profile data will be stored in {config.basePath}
                  /profiles/{config.profileName}
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleOpenProfileDir(config)}
                  >
                    Open Profile Folder
                  </Button>
                </FormHelperText>
                <FormControlLabel
                  label="Evidence Tag"
                  className={`${classes.formControl} ${classes.formControlWithMarginBottom}`}
                  labelPlacement="top"
                  control={
                    <Input
                      id="evidence-tag-input"
                      value={config.evidenceTag}
                      fullWidth
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          evidenceTag: e.target.value,
                        })
                      }
                    />
                  }
                />

                <Box display="flex" flexDirection="column">
                  <FormControlLabel
                    label="Base Path"
                    className={classes.formControl}
                    labelPlacement="top"
                    control={
                      <Input
                        id="profile-path"
                        aria-describedby="profile-path-text"
                        value={config.basePath}
                        fullWidth
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            basePath: e.target.value,
                          })
                        }
                      />
                    }
                  />
                  <FormHelperText>
                    The base path used to compute all the others
                  </FormHelperText>
                  <FormControlLabel
                    label="Backend"
                    className={classes.formControl}
                    labelPlacement="top"
                    control={
                      <Input
                        id="backend"
                        aria-describedby="backend-text"
                        value={config.backend}
                        fullWidth
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            backend: e.target.value,
                          })
                        }
                      />
                    }
                  />
                  <FormHelperText>
                    The backend url used by guardoni
                  </FormHelperText>

                  <FormControlLabel
                    label="Chrome Path"
                    className={classes.formControl}
                    labelPlacement="top"
                    control={
                      <Input
                        id="backend"
                        aria-describedby="backend-text"
                        value={config.chromePath}
                        fullWidth
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            chromePath: e.target.value,
                          })
                        }
                      />
                    }
                  />
                  <FormHelperText>Chrome executable path</FormHelperText>
                </Box>
              </Grid>
              <Grid
                item
                md={6}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <FormControlLabel
                  className={classes.formControlCheckbox}
                  label={'Headless'}
                  labelPlacement="end"
                  control={
                    <Checkbox
                      checked={config.headless}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          headless: e.target.checked,
                        })
                      }
                    />
                  }
                />

                <FormControlLabel
                  className={classes.formControlCheckbox}
                  label={'Verbose'}
                  labelPlacement="end"
                  control={
                    <Checkbox
                      checked={config.verbose}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          verbose: e.target.checked,
                        })
                      }
                    />
                  }
                />
              </Grid>
            </Grid>

            <Tabs
              style={{ width: '100%' }}
              value={tab}
              onChange={(e, t) => {
                setTab(t);
              }}
            >
              <Tab
                label="From CSV"
                style={{ width: '100%' }}
                {...a11yProps(0)}
              />
              <Tab
                label="From URLs"
                style={{ width: '100%' }}
                {...a11yProps(1)}
              />
              <Tab label="Auto" style={{ width: '100%' }} {...a11yProps(2)} />
            </Tabs>
            <TabPanel value={tab} index={0}>
              <FromCSVFileTab
                config={config}
                onSubmit={(experiment) => {
                  runGuardoni(config, experiment);
                }}
              />
            </TabPanel>
            <TabPanel value={tab} index={1}>
              <FromURLsTab
                config={config}
                onSubmit={(experiment) => {
                  runGuardoni(config, experiment);
                }}
              />
            </TabPanel>
            <TabPanel value={tab} index={2}>
              <AutoRunTab
                onSubmit={(experiment) => {
                  runGuardoni(config, experiment);
                }}
              />
            </TabPanel>
          </FormGroup>
        </Grid>
        <Grid item lg={4} md={4} sm={6}>
          <OutputPanel items={outputItems} />
        </Grid>
      </Grid>
    </Box>
  );
};
