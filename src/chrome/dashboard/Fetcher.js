import React from 'react';
import {TextField, Chip, Box, Button } from '@material-ui/core';
import { addRecommendation } from './API/commands';

const styles = {
  width: '100%',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center'
};

const Fetcher = () => {

  const completed = React.useCallback((e) => {
    const url = document.querySelector('[placeholder="Placeholder"]').value;
    addRecommendation(url, { paging: true })();
  }, [])

  return (
    <Box style={styles}>
      <TextField
        label="Recommendation URL"
        placeholder="Placeholder"
        multiline
      />
      <Button variant="contained" color="primary" onClick={completed}>Add</Button>
    </Box>
  );
}

export default Fetcher;
