import React from 'react';

import {
  Input,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
} from '@material-ui/core';
import { Label as LabelIcon } from '@material-ui/icons';
import LocalHospitalRounded from '@material-ui/icons/LocalHospitalRounded';
import TimelineIcon from '@material-ui/icons/Timeline';
import UserSettings from '../../../models/UserSettings';

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings: { ux, active, researchTag, ...settings },
  onSettingsChange,
}) => {
  const toggleActivation = (
    event: React.ChangeEvent<HTMLInputElement>
  ): any => {
    onSettingsChange({
      ...settings,
      researchTag,
      ux,
      active: event.target.checked,
    });
  };

  const toggleUX = (event: React.ChangeEvent<HTMLInputElement>): any => {
    onSettingsChange({
      ...settings,
      researchTag,
      active,
      ux: event.target.checked,
    });
  };

  const doSetResearchTag = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    onSettingsChange({
      ...settings,
      active,
      ux,
      researchTag: event.target.value,
    });
  };

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
          value={researchTag ?? ''}
          style={{ marginLeft: 8 }}
          onChange={doSetResearchTag}
        />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <TimelineIcon />
        </ListItemIcon>
        <ListItemText primary="Enable data donation" />
        <ListItemSecondaryAction>
          <Switch
            edge="end"
            onChange={(x) => toggleActivation(x)}
            checked={active}
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
            checked={ux}
            inputProps={{ 'aria-labelledby': 'tktrex-ux-switch' }}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  );
};

export default Settings;
