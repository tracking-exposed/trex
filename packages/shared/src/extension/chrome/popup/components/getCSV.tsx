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
  const PersonalSearchCSV = `${config.API_ROOT}/v2/personal/${publicKey}/search/csv`;
  const PersonalForYouCSV = `${config.API_ROOT}/v2/personal/${publicKey}/foryou/csv`;
  const PersonalFollowingSV = `${config.API_ROOT}/v2/personal/${publicKey}/following/csv`;
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
        <Link href={PersonalForYouCSV} target="_blank">
          Download &ldquo;For You&rdquo; feed (CSV)
        </Link>
      </ListItem>

      <ListItem button>
        <ListItemIcon>
          <StayCurrentLandscapeIcon />
        </ListItemIcon>
        <Link href={PersonalFollowingSV} target="_blank">
          Download &ldquo;Following&rdquo; feed (CSV)
        </Link>
      </ListItem>

      <ListItem button>
        <ListItemIcon>
          <StayCurrentLandscapeIcon />
        </ListItemIcon>
        <Link href={PersonalSearchCSV} target="_blank">
          Download Searches results (CSV)
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
