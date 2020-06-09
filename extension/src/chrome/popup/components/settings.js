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

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

class Settings extends React.Component{

    constructor (props) {
        console.log("Props in Settings constructor", props);
        super(props);
        this.state = { active: props.active };
    }
        
    render () {

        function toggleActivation (_t, event) {
            console.log("currently value", event.target.checked);
            _t.setState({ active: event.target.checked });
            bo.runtime.sendMessage({
                type: 'configUpdate',
                payload: { active: event.target.checked }
            }, (status) => {
                console.log("status confirmed", status);
            });
        }

        if(!this.state)
            return (<p>Loading...</p>);

        console.log("settings props state", this.props, this.state);

        return (
          <List component="nav" aria-label="main settings">
            <ListItem>
              <ListItemIcon>
                <TimelineIcon />
              </ListItemIcon>
              <ListItemText primary={ (!!this.state && !!this.state.active) ? "turn OFF evidence collection" : "turn ON evidence collection"} />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={_.partial(toggleActivation, this)}
                  checked={this.state ? !!this.state.active : false }
                  inputProps={{ 'aria-labelledby': 'yttrex-main-switch' }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>);
    }

};

export default Settings;