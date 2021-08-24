import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';

import UrlCard from './UrlCard';

const styles = {
    width: '100%',
    textAlign: 'center',
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
    if(e.keyCode == 13) {
      let current = this.state.urlnumber ? this.state.urlnumber : 0;
      this.setState({ newurl: true, urlnumber: current + 1 });
    }
  }

  render () {
    return (
      <div style={styles}>
        <InputLabel>paste or write any URL then press <kbd>Enter</kbd>; It will fetch the preview and send it to the server.</InputLabel>
        <TextField
          fullWidth={true}
          value={this.state.url}
          onChange={this.handleChange}
          onKeyDown={this.completed}
        />
        { this.state.newurl ?
          `fetching ${this.state.urlnumber}...` : ""
        }
        <UrlCard
          key={this.state.urlnumber}
          fetch={true}
          url={this.state.url } />
      </div>
    );
  }
}

          // { this.state.newurl1 ?  <UrlCard data={this.state.lastFetch} /> : "" }
export default Fetcher;
