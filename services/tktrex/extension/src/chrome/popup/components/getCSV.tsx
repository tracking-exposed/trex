import React from 'react';
import config from '../../../config';

import {
  List,
  ListItem,
  ListItemIcon,
  Link,
} from '@material-ui/core';

import {
  StayCurrentLandscape as StayCurrentLandscapeIcon,
  OndemandVideo as OndemandVideoIcon,
  AccountBox as AccountBoxIcon,
} from '@material-ui/icons';

export interface InfoBoxProps {
  publicKey: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ publicKey }) => {
  const homeCSV = `${config.API_ROOT}/personal/${publicKey}/home/csv`;
  const videoCSV = `${config.API_ROOT}/personal/${publicKey}/video/csv`;
  const personalLink = `${config.WEB_ROOT}/personal/#${publicKey}`;

  return (
    <List component="nav" aria-label="controls links files">
      <ListItem button>
        <ListItemIcon>
          <AccountBoxIcon />
        </ListItemIcon>
        <Link href={personalLink} target="_blank">Personal page</Link>
      </ListItem>

      <ListItem button>
        <ListItemIcon>
          <StayCurrentLandscapeIcon />
        </ListItemIcon>
        <Link href={homeCSV} target="_blank">Download Homepage Video CSV</Link>
      </ListItem>

      <ListItem button>
        <ListItemIcon>
          <OndemandVideoIcon />
        </ListItemIcon>
        <Link href={videoCSV} target="_blank">Download Related Video CSV</Link>
      </ListItem>
    </List>
  );
};

export default InfoBox;
