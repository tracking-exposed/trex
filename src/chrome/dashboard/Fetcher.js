import React from 'react';
import {TextField, Chip, Box, Button } from '@material-ui/core';
import { addRecommendation } from './API/commands';

const styles = {
  width: '100%',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center'
};

class Fetcher extends React.PureComponent {
  state = { url: 'https://' };

  completed = (e) => {
    const url = document.querySelector('[placeholder="Placeholder"]').value;
    console.log('fetching opengraph of:', url);
    addRecommendation(url, { paging: true })();
  }

  render () {
    return (
      <Box style={styles}>
        <TextField
          label="Recommendation URL"
          placeholder="Placeholder"
          multiline
        />
        <Button variant="contained" color="primary" onClick={this.completed}>Add</Button>
      </Box>
    );
  }
}

export default Fetcher;
