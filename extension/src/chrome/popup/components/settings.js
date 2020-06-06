import React from 'react';
import _ from 'lodash';
import createReactClass from 'create-react-class';

import Switch from '@material-ui/core/Switch';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import TimelineIcon from '@material-ui/icons/Timeline';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';

import config from '../../../config';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = { active: false, ux: false };


class Settings extends React.Component{

    constructor (props) {
        super(props);
        bo.runtime.sendMessage({ type: 'localLookup' }, (userSettings) => {
            this.setState(userSettings);
        });
    }
        
    toggleActivation(x, syntheticEvent, value) {
        console.log('toggleActivation, switching to', value);
        x.setState({active : value });
        bo.runtime.sendMessage({
            type: 'configUpdate',
            payload: { active: value }
        }, (status) => {
            console.log("status received", status);
            x.setState(status);
        });
    }

    render () {

        return (
          <List component="nav" aria-label="controls links files">
            <ListItem>
              <ListItemIcon>
                <TimelineIcon />
              </ListItemIcon>
              <ListItemText primary="youtube.tracking.exposed active" />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={_.partial(this.toggleActivation, this)}
                  checked={this.state ? this.state.active : DEFAULT_SETTINGS.active }
                  inputProps={{ 'aria-labelledby': 'switch-list-label-wifi' }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>);
    }

};

export default Settings;