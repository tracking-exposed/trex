import { Button, Dialog, DialogActions, Grid } from '@material-ui/core';
import * as React from 'react';
import { GuardoniConfig } from '../../../guardoni/types';
import { ipcRenderer } from 'electron';
import { EVENTS } from '../../models/events';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './confirmationModal.css';

const ConfirmationModal: React.FC<{
  open: boolean;
  onCancel: () => void;
  config: GuardoniConfig;
  onConfigChange: (c: GuardoniConfig) => void;
}> = ({ open, config, onCancel, onConfigChange }) => {
  const [experimentJSON, setExperimentJSON] = React.useState('');
  const [settingsJSON, setSettingsJSON] = React.useState('');
  const [expanded, setExpanded] = React.useState<string | false>(false);
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    // update state when guardoni config has been received
    ipcRenderer.on(EVENTS.GET_EXTENSION_JSON_DATA.value, (event, result) => {
      setExperimentJSON(JSON.stringify(result.experiment, undefined, 4));
      setSettingsJSON(JSON.stringify(result.settings, undefined, 4));
    });

    ipcRenderer.send(EVENTS.GET_EXTENSION_JSON_DATA.value);

    return () => {
      ipcRenderer.removeAllListeners(EVENTS.GET_EXTENSION_JSON_DATA.value);
    };
  }, []);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const cleanExtensionFolder = (): void => {
    ipcRenderer.send(EVENTS.CLEAN_EXTENSION_FOLDER_EVENT.value);
    onConfigChange(config);
  };

  const copyToClipBoard = (data: string): void => {
    void navigator.clipboard.writeText(data);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  return (
    <Dialog open={open} className="confirmationModal">
      <Grid
        container
        style={{ marginBottom: 20, paddingTop: '20px' }}
        className="confirmationModal__dialog"
      >
        {experimentJSON && (
          <Accordion
            className="confirmationModal__dialog__accordion"
            expanded={expanded === 'panel1'}
            onChange={handleChange('panel1')}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>Experiment JSON</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography
                className="confirmationModal__dialog__accordion__typography"
                component={'div'}
              >
                <pre className="confirmationModal__dialog__accordion__typography__json-container">
                  <code>{experimentJSON}</code>
                </pre>
                <button
                  onClick={() => copyToClipBoard(experimentJSON)}
                  className={`confirmationModal__dialog__accordion__typography__copy ${
                    isCopied ? '-copied' : ''
                  }`}
                >
                  {!isCopied ? 'COPY' : 'COPIED!'}
                </button>
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}
        {settingsJSON && (
          <Accordion
            className="confirmationModal__dialog__accordion"
            expanded={expanded === 'panel2'}
            onChange={handleChange('panel2')}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2a-content"
              id="panel2a-header"
            >
              <Typography>Settings JSON</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography
                className="confirmationModal__dialog__accordion__typography"
                component={'div'}
              >
                <pre className="confirmationModal__dialog__accordion__typography__json-container">
                  <code>{settingsJSON}</code>
                </pre>
                <button
                  onClick={() => copyToClipBoard(settingsJSON)}
                  className={`confirmationModal__dialog__accordion__typography__copy ${
                    isCopied ? '-copied' : ''
                  }`}
                >
                  {!isCopied ? 'COPY' : 'COPIED!'}
                </button>
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}
        {!settingsJSON && !experimentJSON && (
          <Typography className="confirmationModal__dialog__empty">
            Your extension folder is already empty!
          </Typography>
        )}
      </Grid>
      <DialogActions className="confirmationModal__actions">
        {settingsJSON && experimentJSON ? (
          <>
            <Button
              className="confirmationModal__actions__delete"
              onClick={() => cleanExtensionFolder()}
            >
              Clean Extension Folder
            </Button>
            <Button onClick={() => onCancel()}>Cancel</Button>
          </>
        ) : (
          <Button onClick={() => onCancel()}>Back</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
