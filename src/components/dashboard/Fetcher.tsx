import { Box, Button, TextField } from '@material-ui/core';
import React from 'react';
import { addRecommendation } from '../../API/commands';

const Fetcher: React.FC = () => {
  const completed = React.useCallback(async (e): Promise<void> => {
    const url = document.querySelector<HTMLInputElement>(
      '[placeholder="Placeholder"]'
    )?.value;
    if (url !== undefined) {
      await addRecommendation({ url })();
    }
  }, []);

  return (
    <Box
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <TextField
        label="Recommendation URL"
        placeholder="Placeholder"
        multiline
      />
      <Button variant="contained" color="primary" onClick={completed}>
        Add
      </Button>
    </Box>
  );
};

export default Fetcher;
