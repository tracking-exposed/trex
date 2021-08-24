import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';

import Recommendations from './Recommendations';
import Fetcher from './Fetcher';

const styles = {
};

class Dashboard extends React.Component{

  constructor(props) {
    super(props);
    this.state = {url: 'https://'};
    this.handleChange = this.handleChange.bind(this);
  } 

  handleChange(e) {
    // this handle the pressing of "Enter" key
    console.log(e.keyCode);
    console.log("Currently", e.target.value, this.state.url);
    if(e.keyCode == 13) {
      console.log("New value recorded", e.target.value);
    }
    this.setState({ url: e.target.value });
  }

  // <Input value={this.state.value} onKeyDown={this.keyPress} onChange={this.handleChange} fullWidth={true} />
  render () {
    return (
      <div style={styles}>
        <h1>
          <code>Submit an URL to fetch-opengraph:</code> 
        </h1>
        <Fetcher />
        <h1>
          <code>Material-UI development test:</code> 
        </h1>
        <Recommendations />
      </div>
    );
  }
}

export default Dashboard;