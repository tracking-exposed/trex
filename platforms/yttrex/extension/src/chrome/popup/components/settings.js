/* eslint-disable */

import React from 'react';
import _ from 'lodash';

import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Switch from '@material-ui/core/Switch';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import TimelineIcon from '@material-ui/icons/Timeline';
import LocalHospitalRounded from '@material-ui/icons/LocalHospitalRounded';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import { Label as LabelIcon } from '@material-ui/icons';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

class Settings extends React.Component {
  constructor(props) {
    console.log('Props in Settings constructor', props);
    super(props);
    this.state = {
      active: props.active,
      ux: props.ux,
      researchTag: props.researchTag,
      experimentId: props.experimentId,
    };
  }

  render() {
    function toggleActivation(_t, event) {
      console.log('Active (value)', event.target.checked);
      _t.setState({ active: event.target.checked });
      saveUpdate({ active: event.target.checked });
    }

    function toggleUX(_t, event) {
      console.log('UX (value)', event.target.checked);
      _t.setState({ ux: event.target.checked });
      saveUpdate({ ux: event.target.checked });
    }

    function saveUpdate(payload) {
      bo.runtime.sendMessage(
        {
          type: 'ConfigUpdate',
          payload,
        },
        (status) => {
          console.log('status confirmed', status);
        }
      );
    }

    const doSetResearchTag = (event) => {
      this.setState({ ...this.state, researchTag: event.target.value });
      saveUpdate(tag);
    };

    const doSetExperimentId = (event) => {
      this.setState({ ...this.state, experimentId: event.target.value });
      saveUpdate(tag);
    };

    if (!this.state) return <p>Loading...</p>;

    console.log('settings props state', this.props, this.state);

    return (
      <List component="nav" aria-label="main settings">
        <ListItem
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ListItemIcon>
            <LabelIcon />
          </ListItemIcon>
          <InputLabel>Tag your Research</InputLabel>
          <Input
            value={this.state.researchTag}
            style={{ marginLeft: 8 }}
            onChange={doSetResearchTag}
          />
        </ListItem>
        {this.state.experimentId ? (
          <ListItem
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <ListItemIcon>
              <LabelIcon />
            </ListItemIcon>
            <InputLabel>Experiment Id</InputLabel>
            <Input
              value={this.state.experimentId}
              style={{ marginLeft: 8 }}
              onChange={doSetExperimentId}
            />
          </ListItem>
        ) : null}
        <ListItem>
          <ListItemIcon>
            <TimelineIcon />
          </ListItemIcon>
          <ListItemText
            primary={
              !!this.state && !!this.state.active
                ? 'turn OFF evidence collection'
                : 'turn ON evidence collection'
            }
          />
          <ListItemSecondaryAction>
            <Switch
              edge="end"
              onChange={_.partial(toggleActivation, this)}
              checked={this.state ? !!this.state.active : false}
              inputProps={{ 'aria-labelledby': 'yttrex-main-switch' }}
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <LocalHospitalRounded />
          </ListItemIcon>
          <ListItemText
            primary={
              !!this.state && !!this.state.ux
                ? 'Disable UX dev hack'
                : "Enable UX dev support (don't)"
            }
          />
          <ListItemSecondaryAction>
            <Switch
              edge="end"
              onChange={_.partial(toggleUX, this)}
              checked={this.state ? !!this.state.ux : false}
              inputProps={{ 'aria-labelledby': 'yttrex-ux-switch' }}
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    );
  }
}

export default Settings;
