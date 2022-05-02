import { Box, Button, Grid, Typography, useTheme } from '@material-ui/core';
import { BrowserView, ipcRenderer, shell } from 'electron';
import * as React from 'react';
import { RouteComponentProps, useHistory } from 'react-router';
import { GuardoniPlatformConfig } from '../../../guardoni/types';
import { EVENTS } from '../../models/events';
import ElectronBrowserView from './browser-view/ElectronBrowserView';
import OutputPanel from './OutputPanel';
import LinkIcon from '@material-ui/icons/LinkOutlined';

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

  const handleRun = React.useCallback(() => {
    onRun(experimentId);
    setPhase({ step: 'Run' });
  }, [view, experimentId]);

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
    <Grid container style={{ height: '100%' }}>
      <Grid
        item
        lg={4}
        sm={5}
        style={{
          height: '100%',
          flexShrink: 0,
          padding: theme.spacing(2),
        }}
      >
        <Box
          pl={2}
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
          }}
        >
          <Box pt={3} pb={2}>
            <Typography variant="h4">Experiment</Typography>
          </Box>
          <Box>
            <Typography>{experimentId}</Typography>
            <Box
              style={{
                display: 'flex',
                flexGrow: 1,
                marginRight: 20,
                alignItems: 'center',
              }}
            >
              <LinkIcon />
              <Typography variant="subtitle2">- links lenght TODO</Typography>
            </Box>
          </Box>
          <Box
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              width: '100%',
              paddingTop: theme.spacing(2),
              paddingBottom: theme.spacing(4),
            }}
          >
            <Button
              variant="contained"
              color="secondary"
              style={{ marginRight: theme.spacing(2) }}
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
                handleRun();
              }}
            >
              Run
            </Button>
          </Box>
          <OutputPanel items={outputItems} />
        </Box>
      </Grid>
      <Grid
        item
        lg={8}
        sm={7}
        style={{ display: 'flex', padding: theme.spacing(2), flexShrink: 0 }}
      >
        {phase.step === 'Ready' || phase.step === 'Run' ? (
          <ElectronBrowserView
            ref={(view: any) => {
              setView(view);
            }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : (
          <Box
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            <Box pt={3} pl={4}>
              <Box pb={2}>
                <Typography variant="h4" style={{ color: '#23AA9A' }}>
                  {' '}
                  Finished!{' '}
                </Typography>
              </Box>
              <Typography variant="body1">
                <b>Experiment id:</b> {phase.payload.values.experimentId}
              </Typography>
              <Typography variant="body1">
                <b>Public Key:</b> {phase.payload.values.publicKey}
              </Typography>
              <Box pt={4}>
                <Button
                  variant="contained"
                  style={{
                    marginRight: theme.spacing(2),
                    backgroundColor: 'white',
                  }}
                  onClick={() => {
                    onOpenExperimentResults(phase.payload.values.experimentId);
                  }}
                >
                  Open experiment results page
                </Button>
                <Button
                  variant="contained"
                  style={{
                    color: '#23AA9A',
                    backgroundColor: 'white',
                  }}
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
      </Grid>
    </Grid>
  );
};

const ExperimentExecutionRoute: React.FC<
  RouteComponentProps<{ experimentId: string }> & {
    config: GuardoniPlatformConfig;
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
      `${config.backend}/v2/experiment/${experimentId}/json`
    );
  }, []);

  const onOpenResults = React.useCallback((publicKey: string): void => {
    void shell.openExternal(`${config.backend}/v1/personal/${publicKey}`);
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
