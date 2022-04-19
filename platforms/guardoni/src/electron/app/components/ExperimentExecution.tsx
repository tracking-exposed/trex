import { Box, Button, Grid, Typography, useTheme } from '@material-ui/core';
import { BrowserView, ipcRenderer, shell } from 'electron';
import * as React from 'react';
import { RouteComponentProps, useHistory } from 'react-router';
import { GuardoniConfigRequired } from '../../../guardoni/types';
import { EVENTS } from '../../models/events';
import ElectronBrowserView from './browser-view/ElectronBrowserView';
import OutputPanel from './OutputPanel';

interface ExperimentExecutionProps {
  experimentId: string;
  onClose: () => void;
  onRun: (experimentId: string) => void;
  onOpenExperimentResults: (experimentId: string) => void;
  onOpenResults: (publicKey: string) => void;
}

type ExperimentExecutionStatePhase =
  | {
      step: 'Ready';
    }
  | {
      step: 'Run';
    }
  | {
      step: 'Finished';
      payload: {
        values: {
          experimentId: string;
          publicKey: string;
        };
      };
    };

const ExperimentExecution: React.FC<ExperimentExecutionProps> = ({
  experimentId,
  onClose,
  onRun,
  onOpenExperimentResults,
  onOpenResults,
}) => {
  const theme = useTheme();
  const [phase, setPhase] = React.useState<ExperimentExecutionStatePhase>({
    step: 'Ready',
  });
  const [view, setView] = React.useState<BrowserView | null>(null);
  const [outputItems, setOutputItems] = React.useState([]);

  const handleRun = React.useCallback(
    (v: any) => {
      onRun(experimentId);
    },
    [view, experimentId]
  );

  // update guardoni output when proper event is received

  const handleOutputItems = React.useCallback(
    (output) => {
      setOutputItems(outputItems.concat(output));
    },
    [outputItems]
  );

  React.useEffect(() => {
    ipcRenderer.on(EVENTS.GUARDONI_OUTPUT_EVENT.value, (event, output) => {
      handleOutputItems(output);
    });

    ipcRenderer.on(EVENTS.RUN_GUARDONI_EVENT.value, (event, ...args) => {
      const payload = args[0];

      const values = payload.values[0];

      setPhase({
        step: 'Finished',
        payload: {
          values,
        },
      });
    });
  });

  return (
    <Grid container spacing={2} style={{ height: '100%', margin: 0 }}>
      <Grid
        item
        lg={9}
        sm={8}
        style={{
          height: '100%',
        }}
      >
        <Box
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
          }}
        >
          <Box
            style={{
              display: 'flex',
              width: '100%',
              padding: theme.spacing(2),
            }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                onClose();
              }}
            >
              Close
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleRun(view);
              }}
            >
              Run
            </Button>
          </Box>
          <Box style={{ display: 'flex', flexGrow: 2, width: '100%' }}>
            {phase.step === 'Ready' || phase.step === 'Run' ? (
              <ElectronBrowserView
                ref={(view: any) => {
                  setView(view);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: 10,
                }}
              />
            ) : (
              <Box>
                Finished
                <Box>
                  <Typography>
                    Experiment id: {phase.payload.values.experimentId}
                  </Typography>
                  <Typography>
                    Public Key: {phase.payload.values.publicKey}
                  </Typography>
                  <Box>
                    <Button
                      onClick={() => {
                        onOpenExperimentResults(
                          phase.payload.values.experimentId
                        );
                      }}
                    >
                      Open experiment results page
                    </Button>
                    <Button
                      onClick={() => {
                        onOpenResults(phase.payload.values.publicKey);
                      }}
                    >
                      Open your result page
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Grid>
      <Grid item lg={3} sm={4} style={{ display: 'flex', flexShrink: 0 }}>
        <OutputPanel items={outputItems} />
      </Grid>
    </Grid>
  );
};

const ExperimentExecutionRoute: React.FC<
  RouteComponentProps<{ experimentId: string }> & {
    config: GuardoniConfigRequired;
  }
> = ({ config, match }) => {
  const history = useHistory();

  const onClose = React.useCallback(() => {
    history.goBack();
  }, []);

  const onRun = React.useCallback(
    (experimentId: string): void => {
      ipcRenderer.send(EVENTS.RUN_GUARDONI_EVENT.value, config, experimentId);
    },
    [match.params.experimentId]
  );

  const onOpenExperimentResults = React.useCallback((experimentId: string) => {
    void shell.openExternal(
      `${config.platform.backend}/v2/experiment/${experimentId}/json`
    );
  }, []);

  const onOpenResults = React.useCallback((publicKey: string): void => {
    void shell.openExternal(
      `${config.platform.backend}/v1/personal/${publicKey}`
    );
  }, []);

  return (
    <ExperimentExecution
      experimentId={match.params.experimentId}
      onClose={onClose}
      onRun={onRun}
      onOpenExperimentResults={onOpenExperimentResults}
      onOpenResults={onOpenResults}
    />
  );
};

export default ExperimentExecutionRoute;
