import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';

import UrlCard from './UrlCard';

const styles = {
  width: '100%',
  textAlign: 'center',
};

const prestyle = {
  backgroundColor: '#f4f7da',
  textAlign: 'left',
};

class LinkAccount extends React.Component{

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
        <InputLabel>
          Your Channel name or a Video of yours then <kbd>Enter</kbd>
        </InputLabel>
        <TextField
          fullWidth={true}
          value={this.state.url}
          onChange={this.handleChange}
          onKeyDown={this.completed}
        />
        <code>State dump</code>
        <pre style={prestyle}>{JSON.stringify(this.state)}</pre>
        <pre style={prestyle}>{JSON.stringify(this.props)}</pre>
        <UrlCard
          key={this.state.urlnumber}
          fetch={true}
          url={this.state.url } />
      </div>
    );
  }
}

export default LinkAccount;
