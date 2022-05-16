import {
  Box,
  Button,
  FormControlLabel,
  Input,
  Typography,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { EVENTS } from '../models/events';
import { GuardoniConfig } from '../../guardoni/types';
import { ExperimentLink } from '@shared/models/Experiment';

interface FromCSVFileTabProps {
  config: GuardoniConfig;
  onSubmit: (expId: string) => void;
}

interface URLState {
  newURL: string | undefined;
  newTitle: string | undefined;
  newURLTag: string | undefined;
  newWatchFor: string | number | null;
  urls: ExperimentLink[];
}

export const FromURLsTab: React.FC<FromCSVFileTabProps> = ({
  config,
  onSubmit,
}) => {
  const [{ newURL, newTitle, newURLTag, newWatchFor, urls }, setURLs] =
    React.useState<URLState>({
      newURL: undefined,
      newTitle: undefined,
      newURLTag: undefined,
      newWatchFor: null,
      urls: [],
    });

  const handleURLProcess = React.useCallback(() => {
    ipcRenderer.send(
      EVENTS.CREATE_EXPERIMENT_EVENT.value,
      config,
      urls.map((u) => ({ ...u, videoURL: u.url }))
    );
  }, [config, urls]);

  React.useEffect(() => {
    // subscribe for CREATE_EXPERIMENT_EVENT
    const createExperimentHandler = (
      _ev: Electron.Event,
      ...args: any[]
    ): void => {
      onSubmit(args[0]);
    };

    ipcRenderer.on(EVENTS.CREATE_EXPERIMENT_EVENT.value, createExperimentHandler);

    return () => {
      // remove the listener when component is unmount
      ipcRenderer.removeListener(
        EVENTS.CREATE_EXPERIMENT_EVENT.value,
        createExperimentHandler
      );
    };
  }, []);

  return (
    <Box width={'100%'}>
      <Box>
        <FormControlLabel
          label="URL"
          labelPlacement="top"
          control={
            <Input
              value={newURL ?? ''}
              onChange={(e) => {
                setURLs({
                  urls,
                  newTitle,
                  newURLTag,
                  newWatchFor,
                  newURL: e.target.value,
                });
              }}
            />
          }
        />

        <FormControlLabel
          label="Title"
          labelPlacement="top"
          control={
            <Input
              value={newTitle ?? ''}
              required
              onChange={(e) => {
                setURLs({
                  urls,
                  newURL,
                  newURLTag,
                  newWatchFor,
                  newTitle: e.target.value,
                });
              }}
            />
          }
        />

        <FormControlLabel
          label="URL Tag"
          labelPlacement="top"
          control={
            <Input
              value={newURLTag ?? ''}
              required
              onChange={(e) => {
                setURLs({
                  urls,
                  newURL,
                  newTitle,
                  newWatchFor,
                  newURLTag: e.target.value,
                });
              }}
            />
          }
        />
        <FormControlLabel
          label="Watch For"
          labelPlacement="top"
          control={
            <Input
              value={newWatchFor ?? ''}
              onChange={(e) => {
                setURLs({
                  urls,
                  newURL,
                  newTitle,
                  newURLTag,
                  newWatchFor: e.target.value,
                });
              }}
            />
          }
        />
        <Button
          disabled={(newURL?.length ?? 0) < 7 && (newTitle?.length ?? 0) < 5}
          onClick={() => {
            if (newURL && newTitle && newURLTag) {
              setURLs({
                newURL: undefined,
                newTitle: undefined,
                newURLTag: undefined,
                newWatchFor: null,
                urls: urls.concat({
                  url: newURL,
                  title: newTitle,
                  urltag: newURLTag,
                  watchFor: newWatchFor,
                }),
              });
            }
          }}
        >
          Add URL
        </Button>
      </Box>
      {urls.map((u) => (
        <Box key={u.title}>
          <Typography>{u.title}</Typography>
          <Typography>{u.url}</Typography>
        </Box>
      ))}

      <Button
        disabled={urls.length < 1}
        color="primary"
        variant="contained"
        style={{ marginBottom: 20, marginTop: 20 }}
        onClick={() => handleURLProcess()}
      >
        Start guardoni
      </Button>
    </Box>
  );
};
