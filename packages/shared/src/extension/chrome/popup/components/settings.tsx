import React, { useState } from 'react';

import {
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@material-ui/core';

import TimelineIcon from '@material-ui/icons/Timeline';
import LocalHospitalRounded from '@material-ui/icons/LocalHospitalRounded';

import UserSettings from '../../../models/UserSettings';
import { configUpdate } from '../../background/sendMessage';

interface SettingsState extends Partial<UserSettings> {
  ux: boolean;
  active: boolean;
}

export const Settings: React.FC<SettingsState> = ({ ux, active }) => {
  const [uxOn, setUX] = useState(ux);
  const [activeOn, setActive] = useState(active);

  const toggleActivation = (
    event: React.ChangeEvent<HTMLInputElement>
  ): any => {
    setActive(event.target.checked);
    configUpdate({ active: event.target.checked }, () => null);
  };

  const toggleUX = (event: React.ChangeEvent<HTMLInputElement>): any => {
    setUX(event.target.checked);
    configUpdate({ ux: event.target.checked }, () => null);
  };

  return (
    <List component="nav" aria-label="main settings">
      <ListItem>
        <ListItemIcon>
          <TimelineIcon />
        </ListItemIcon>
        <ListItemText primary="Enable data donation" />
        <ListItemSecondaryAction>
          <Switch
            edge="end"
            onChange={(x) => toggleActivation(x)}
            checked={activeOn}
            inputProps={{ 'aria-labelledby': 'tktrex-main-switch' }}
          />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <LocalHospitalRounded />
        </ListItemIcon>
        <ListItemText primary="Show analyzed page items (for debugging)" />
        <ListItemSecondaryAction>
          <Switch
            edge="end"
            onChange={toggleUX}
            checked={uxOn}
            inputProps={{ 'aria-labelledby': 'tktrex-ux-switch' }}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  );
};

export default Settings;
