import {
  Box,
  Button,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Select,
} from '@material-ui/core';
import { GuardoniExperiment } from '@shared/models/Experiment';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { GET_PUBLIC_DIRECTIVES } from '../models/events';

interface FromCSVFileTabProps {
  onSubmit: (experimentId: string) => void;
}

export const AutoRunTab: React.FC<FromCSVFileTabProps> = ({ onSubmit }) => {
  const [directiveId, setDirectiveId] = React.useState<string | undefined>(
    undefined
  );
  const [directives, setDirectives] = React.useState<GuardoniExperiment[]>([]);

  React.useEffect(() => {
    ipcRenderer.on(GET_PUBLIC_DIRECTIVES.value, (event, ...args) => {
      const [directives] = args;
      console.log({ args, directives });
      setDirectives(directives);
    });

    ipcRenderer.send(GET_PUBLIC_DIRECTIVES.value);
  }, []);

  const currentDirective = directives.find(
    (d) => d.experimentId === directiveId
  );

  return (
    <Box display={'flex'} flexDirection={'column'}>
      <FormControlLabel
        label="Experiment"
        labelPlacement="top"
        control={
          <Select
            value={directiveId}
            onChange={(e, v) => setDirectiveId(e.target.value as any)}
            fullWidth
          >
            {directives.map((d, i) => (
              <MenuItem value={d.experimentId} selected={i === 0}>
                {d.experimentId}
              </MenuItem>
            ))}
          </Select>
        }
      />
      {currentDirective ? (
        <Box>
          <pre>{JSON.stringify(currentDirective, null, 2)}</pre>
          <Button
            color="primary"
            variant="contained"
            style={{ marginBottom: 20, marginTop: 20 }}
            onClick={() => {
              void onSubmit(currentDirective.experimentId);
            }}
          >
            Start guardoni
          </Button>
        </Box>
      ) : null}

      <FormHelperText>
        The value provided here refers to existing experiments:
        <br />
        1. Greta - Climate Change
        <br />
        2. Dunno
      </FormHelperText>
    </Box>
  );
};
