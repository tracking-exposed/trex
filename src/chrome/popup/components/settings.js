import React from 'react';
import _ from 'lodash';
import createReactClass from 'create-react-class';

import Switch from '@material-ui/core/Switch';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import TimelineIcon from '@material-ui/icons/Timeline';
import BuildIcon from '@material-ui/icons/Build';
import ShopIcon from '@material-ui/icons/Shop';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

class Settings extends React.Component{

    constructor (props) {
        console.log("Props in Settings constructor", props);
        super(props);
        this.state = {
          active: props.lastSettings.active,
          svg: props.lastSettings.svg,
          videorep: props.lastSettings.videorep
        };
    }
        
    render () {

        function toggleActivation (_t, event) {
            const switchname = event.target.getAttribute('aria-labelledby').split('-')[1];
            console.log("current value is", event.target.checked, "switchname", switchname);
            const payload = {};
            payload[switchname] = event.target.checked;
            console.log("Future status", JSON.stringify(payload));
            _t.setState(payload);
            bo.runtime.sendMessage({
                type: 'configUpdate',
                payload
            }, (status) => {
                console.log("status confirmed", JSON.stringify(status));
            });
        }

        if(!this.state)
            return (<p>Loading...</p>);

        console.log("settings props", this.props, "& state", this.state);

        return (
          <List component="nav" aria-label="main settings">
            <ListItem>
              <ListItemIcon>
                <TimelineIcon />
              </ListItemIcon>
              <ListItemText primary={ (!!this.state && !!this.state.active) ? "LEAVE evidence collection pool" : "JOIN evidence collection pool"} />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={_.partial(toggleActivation, this)}
                  checked={this.state ? !!this.state.active : false }
                  inputProps={{ 'aria-labelledby': 'ycai-active-switch' }}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <BuildIcon />
              </ListItemIcon>
              <ListItemText primary={ (!!this.state && !!this.state.svg) ? "turn OFF SVG experiment" : "turn ON SVG experiment"} />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={_.partial(toggleActivation, this)}
                  checked={this.state ? !!this.state.svg: false }
                  inputProps={{ 'aria-labelledby': 'ycai-svg-switch' }}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <ShopIcon />
              </ListItemIcon>
              <ListItemText primary={ (!!this.state && !!this.state.videorep) ? "turn OFF video replacement" : "turn ON video replacement"} />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={_.partial(toggleActivation, this)}
                  checked={this.state ? !!this.state.videorep: false }
                  inputProps={{ 'aria-labelledby': 'ycai-videorep-switch' }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>);
    }

};

export default Settings;