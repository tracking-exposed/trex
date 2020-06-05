import React from 'react';
import _ from 'lodash';
import createReactClass from 'create-react-class';
import update from 'immutability-helper';

import Switch from '@material-ui/core/Switch';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import TimelineIcon from '@material-ui/icons/Timeline';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';


// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = { active: false, ux: false };

function toggleActivation(syntheticEvent, value) {
    console.log('toggleActivation, now switching to:', value);
    return value;
}

const Settings = createReactClass({

    render () {
        console.log(this.state, this);
        if(!this.props) {
            console.log("Invalid condition of !this.state before render <Settings>");
            return;
        }

        let isActive = _.get(this, 'props.active');
        let specialUX = _.get(this, 'props.ux');
        let state = {
            active: isActive,
            ux: specialUX
        };

        if( _.isUndefined(isActive) || _.isUndefined(specialUX)) {
            console.log("Lack of saved parameters, imposing defaults");
            isActive = DEFAULT_SETTINGS.active;
            specialUX = DEFAULT_SETTINGS.ux;
        }

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
                  onChange={toggleActivation}
                  checked={state.active}
                  inputProps={{ 'aria-labelledby': 'switch-list-label-wifi' }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>);
    }
});

export default Settings;