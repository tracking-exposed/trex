import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';


const styles = {
    width: '100%',
    textAlign: 'left',
};

class Fetcher extends React.Component{

  constructor(props) {
    super(props);
    this.state = {url: 'https://'};
    this.handleChange = this.handleChange.bind(this);
    this.completed = this.completed.bind(this);
  } 

  handleChange(e) {
    this.setState({ url: e.target.value });
  }

  completed(e) {
    // this handle the pressing of "Enter" key
    if(e.keyCode === 13) {
      let current = this.state.urlnumber ? this.state.urlnumber : 0;
      this.setState({ newurl: true, urlnumber: current + 1 });
    }
  }

  render () {
    return (
      <div style={styles}>
        <TextField
          onChange={this.handleChange}
          onKeyDown={this.completed}
          label="Recommendation URL"
          placeholder="Placeholder"
          multiline
        />
        <Chip color="secondary" label="Add +" />
      </div>
    );
  }
}

          // { this.state.newurl1 ?  <UrlCard data={this.state.lastFetch} /> : "" }
export default Fetcher;
