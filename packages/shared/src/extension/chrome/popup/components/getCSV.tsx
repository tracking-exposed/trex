import React from 'react';
import config from '../../../config';

import { List, ListItem, ListItemIcon, Link } from '@material-ui/core';

import {
  StayCurrentLandscape as StayCurrentLandscapeIcon,
  // OndemandVideo as OndemandVideoIcon,
  AccountBox as AccountBoxIcon,
} from '@material-ui/icons';

export interface InfoBoxProps {
  publicKey: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ publicKey }) => {
  const PersonalSearchCSV = `${config.API_ROOT}/personal/${publicKey}/search/csv`;
  // const videoCSV = `${config.API_ROOT}/personal/${publicKey}/video/csv`;
  const personalLink = `${config.WEB_ROOT}/personal/#${publicKey}`;

  return (
    <List component="nav" aria-label="controls links files">
      <ListItem button>
        <ListItemIcon>
          <AccountBoxIcon />
        </ListItemIcon>
        <Link href={personalLink} target="_blank">
          Evidence log page
        </Link>
      </ListItem>

      <ListItem button>
        <ListItemIcon>
          <StayCurrentLandscapeIcon />
        </ListItemIcon>
        <Link href={PersonalSearchCSV} target="_blank">
          Download Your Searches (CSV)
        </Link>
      </ListItem>
    </List>
  );
};
/* -- kept only Personal Search CSV from popup
      <ListItem button>
        <ListItemIcon>
          <OndemandVideoIcon />
        </ListItemIcon>
        <Link href={videoCSV} target="_blank">
          Download ForYou Video (CSV)
        </Link>
      </ListItem> */

export default InfoBox;
