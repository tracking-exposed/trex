import React from 'react';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';
import { addRecommendation } from './API/commands';

const styles = {
  width: '100%',
  textAlign: 'left'
};

class Fetcher extends React.PureComponent {
  state = { url: 'https://' };

  completed = (e) => {
    const url = document.querySelector('[placeholder="Placeholder"]').value;
    console.log('fetching ...', url);
    addRecommendation(encodeURIComponent(url), { paging: true })();
  }

  render () {
    return (
      <div style={styles}>
        <TextField
          label="Recommendation URL"
          placeholder="Placeholder"
          multiline
        />
        <Chip color="secondary" onClick={this.completed} label="Add" />
      </div>
    );
  }
}

export default Fetcher;
