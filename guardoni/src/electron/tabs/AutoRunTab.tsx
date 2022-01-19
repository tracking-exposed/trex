import {
  Box,
  Button,
  FormControlLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@material-ui/core';
import * as React from 'react';

type Auto = 1 | 2;

interface FromCSVFileTabProps {
  onSubmit: (payload: Auto) => void;
}

export const AutoRunTab: React.FC<FromCSVFileTabProps> = ({ onSubmit }) => {
  const [auto, setAuto] = React.useState<Auto>(1);

  return (
    <Box display={'flex'} flexDirection={'column'}>
      <FormControlLabel
        label="Auto"
        control={
          <Select
            value={auto}
            onChange={(e, v) => setAuto(e.target.value as any)}
          >
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
          </Select>
        }
      />

      <FormHelperText>
        The value provided here refers to existing experiments:
        <br />
        1. Greta - Climate Change
        <br />
        2. Dunno
      </FormHelperText>

      <Button
        color="primary"
        variant="contained"
        style={{ marginBottom: 20, marginTop: 20 }}
        onClick={() => {
          void onSubmit(auto);
        }}
      >
        Start guardoni
      </Button>
    </Box>
  );
};
