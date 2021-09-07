import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';


const styles = {
    width: '100%',
    textAlign: 'left',
};

const config = {
  API_ROOT: "http://localhost:9000/api/v3"
}

class Fetcher extends React.Component{

  constructor(props) {
    super(props);
    this.state = {url: 'https://'};
    this.completed = this.completed.bind(this);
  } 

  completed(e) {
    const url = document.querySelector('[placeholder="Placeholder"]').value;
    console.log("fetching ...", url);
    const p = encodeURIComponent(url);
    const ycurl = config.API_ROOT + '/ogp/' + p;
    fetch(ycurl)
      .then(resp => resp.json());
  }

  render () {
    return (
      <div style={styles}>
        <TextField
          label="Recommendation URL"
          placeholder="Placeholder"
          multiline
        />
        <Chip color="secondary"
          onClick={this.completed}
         label="Add" />
      </div>
    );
  }
}

          // { this.state.newurl1 ?  <UrlCard data={this.state.lastFetch} /> : "" }
export default Fetcher;
