import moment from 'moment';
import React from 'react';
import config from '../../config';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormControl from '@material-ui/core/FormControl';

import Recommendations from './Recommendations';

const styles = {
    width: '100%',
    textAlign: 'center',
};

class Dashboard extends React.Component{

  constructor(props) {
    super(props);
    this.state = {value:''}

    this.handleChange = this.handleChange.bind(this);
    this.keyPress = this.keyPress.bind(this);
  } 

  handleChange(e) {
    console.log("new value recorded", e.target.value);
    this.setState({ value: e.target.value });
  }

  keyPress(e) {
    // this handle the pressing of "Enter" key
    if(e.keyCode == 13) {

       console.log('got value:', e.target.value);
    }
  }

  render () {
    return (
      <div style={styles}>
        <h1>
          <code>Submit URL, get fetch-opengraph:</code> 
        </h1>
        <br /> <br />
        <FormControl fullWidth noValidate autoComplete="off">
          <InputLabel>paste any URL, it would fetch the opengraph and send it to the server.</InputLabel>
          <Input value={this.state.value} onKeyDown={this.keyPress} onChange={this.handleChange} fullWidth={true} />
        </FormControl>
        
        <br /> <br />
        <h1>
          <code>Simulation on how a content creation would control their recommendations:</code> 
        </h1>
        <Recommendations />
      </div>
    );
  }
}

export default Dashboard;
