import React from 'react';
import _ from 'lodash';

import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';

import Divider from './Divider';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

class Settings extends React.Component {
  constructor(props) {
    // eslint-disable-next-line no-console
    console.log('Props in Settings constructor', props);
    super(props);
    this.state = {
      ux: props.lastSettings.ux || false,
      community: props.lastSettings.community || false,
      alphabeth: props.lastSettings.alphabeth || false,
    };
  }

  render() {
    function toggleActivation(_t, event) {
      const switchname = event.target.parentElement.parentElement
        .getAttribute('aria-labelledby')
        .split('-')[1];
      // eslint-disable-next-line no-console
      console.log(
        `it is checked: ${event.target.checked} | switchname ${switchname}`
      );
      const payload = {};
      payload[switchname] = event.target.checked;
      // eslint-disable-next-line no-console
      console.log(`update is ${JSON.stringify(payload)} current ${_t.state}`);
      _t.setState(payload);
      bo.runtime.sendMessage(
        {
          type: 'configUpdate',
          payload,
        },
        (status) => {
          // eslint-disable-next-line no-console
          console.log('status confirmed', JSON.stringify(status));
        }
      );
    }

    if (!this.state) {
      return <p>Loading...</p>;
    }
    // eslint-disable-next-line no-console
    console.log('settings props', this.props, '& state', this.state);
    /* <ListItemText primary={ (!!this.state && !!this.state.active) ? "LEAVE evidence collection pool" : "JOIN evidence collection pool"} /> */

    return (
      <FormControl component="fieldset">
        <FormGroup aria-label="position" row>
          <FormControlLabel
            control={
              <Switch
                aria-labelledby="switch-ux"
                color="primary"
                checked={this.state.ux}
                onChange={_.partial(toggleActivation, this)}
              />
            }
            label="Show reccomendations from Content Creators"
            labelPlacement="end"
          />
          <Divider helperText="YouChoose" />
          <FormControlLabel
            control={
              <Switch
                aria-labelledby="switch-community"
                color="primary"
                checked={this.state.community}
                onChange={_.partial(toggleActivation, this)}
              />
            }
            label="Show Community recommendations"
            labelPlacement="end"
          />
          <Divider helperText="Tournesol" />
          <FormControlLabel
            control={
              <Switch
                aria-labelledby="switch-alphabeth"
                color="primary"
                checked={this.state.alphabeth}
                onChange={_.partial(toggleActivation, this)}
              />
            }
            label="Show YT algorithmic recommendations"
            labelPlacement="end"
          />
          <Divider helperText="Youtube defaults" />
        </FormGroup>
      </FormControl>
    );
  }
}

export default Settings;
