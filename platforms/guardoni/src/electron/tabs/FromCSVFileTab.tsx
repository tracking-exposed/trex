import {
  Box,
  Button,
  FormControlLabel,
  FormHelperText,
} from '@material-ui/core';
import { ComparisonDirective } from '@shared/models/Directive';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { GuardoniConfig } from '../../guardoni/types';
import { EVENTS } from '../models/events';

interface FromCSVFileTabProps {
  config: GuardoniConfig;
  onSubmit: (experimentId: string) => void;
}

interface CSVFile {
  path: string;
  parsed: ComparisonDirective[];
}

export const FromCSVFileTab: React.FC<FromCSVFileTabProps> = ({
  config,
  onSubmit,
}) => {
  const [csvFile, setCSVFile] = React.useState<CSVFile | undefined>(undefined);

  const handleCSVPick = React.useCallback(() => {
    void ipcRenderer.send(EVENTS.PICK_CSV_FILE_EVENT.value);
  }, []);

  const handleRunExperiment = React.useCallback(() => {
    ipcRenderer.send(EVENTS.CREATE_EXPERIMENT_EVENT.value, config, csvFile?.parsed);
  }, [config, csvFile?.parsed]);

  React.useEffect(() => {
    ipcRenderer.on(EVENTS.PICK_CSV_FILE_EVENT.value, (event, output: CSVFile) => {
      setCSVFile(output);
    });

    const createExperimentHandler = (
      event: Electron.Event,
      ...args: any[]
    ): void => {
      onSubmit(args[0]);
    };

    ipcRenderer.on(EVENTS.CREATE_EXPERIMENT_EVENT.value, createExperimentHandler);

    return () => {
      ipcRenderer.removeListener(
        EVENTS.CREATE_EXPERIMENT_EVENT.value,
        createExperimentHandler
      );
    };
  }, []);

  return (
    <Box width="100%" display={'flex'} flexDirection={'column'}>
      <FormControlLabel
        label=""
        labelPlacement="top"
        control={
          <Button
            color="secondary"
            variant="contained"
            onClick={(e) => handleCSVPick()}
          >
            Select a csv file
          </Button>
        }
      />
      <FormHelperText>CSV loaded from {csvFile?.path}</FormHelperText>
      {csvFile?.path ? (
        <pre>{JSON.stringify(csvFile.parsed, null, 2)}</pre>
      ) : null}

      <Button
        disabled={csvFile?.parsed === undefined}
        color="primary"
        variant="contained"
        style={{ marginTop: 20, marginBottom: 20 }}
        onClick={() => {
          void handleRunExperiment();
        }}
      >
        Run experiment from CSV
      </Button>
    </Box>
  );
};
