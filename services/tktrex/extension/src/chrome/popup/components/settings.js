import React from 'react';
import _ from 'lodash';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

class Settings extends React.Component {
    constructor (props) {
        super(props);
        this.state = { active: props.active, ux: props.ux };
    }

    render () {
        function toggleActivation (_t, event) {
            console.log('Active (value)', event.target.checked);
            _t.setState({ active: event.target.checked });
            saveUpdate({ active: event.target.checked });
        }

        function toggleUX (_t, event) {
            console.log('UX (value)', event.target.checked);
            _t.setState({ ux: event.target.checked });
            saveUpdate({ ux: event.target.checked });
        }

        function saveUpdate (payload) {
            bo.runtime.sendMessage({
                type: 'configUpdate',
                payload
            }, (status) => {
                console.log('status confirmed', status);
            });
        }

        if (!this.state) { return (<p>Loading...</p>); }

        console.log('settings props state', this.props, this.state);

        return (
          <List component="nav" aria-label="main settings">
            <ListItem>
              <ListItemIcon>
                <TimelineIcon />
              </ListItemIcon>
              <ListItemText primary={ (!!this.state && !!this.state.active) ? 'turn OFF evidence collection' : 'turn ON evidence collection'} />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={_.partial(toggleActivation, this)}
                  checked={this.state ? !!this.state.active : false }
                  inputProps={{ 'aria-labelledby': 'tktrex-main-switch' }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LocalHospitalRounded />
              </ListItemIcon>
              <ListItemText primary={ (!!this.state && !!this.state.ux) ? 'Disable UX dev hack' : "Enable UX dev support (don't)"} />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={_.partial(toggleUX, this)}
                  checked={this.state ? !!this.state.ux : false }
                  inputProps={{ 'aria-labelledby': 'tktrex-ux-switch' }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>);
    }
};

export default Settings;
