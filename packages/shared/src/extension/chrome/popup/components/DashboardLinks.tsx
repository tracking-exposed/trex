import React from 'react';
import { List, ListItem, ListItemIcon, Link } from '@material-ui/core';

export interface DashboardLink {
  url: string;
  label: string;
  icon: React.ReactElement;
}

export interface DashboardLinksProps {
  publicKey: string;
  getLinks: (opts: { publicKey: string }) => DashboardLink[];
}

export const DashboardLinks: React.FC<DashboardLinksProps> = ({
  publicKey,
  getLinks,
}) => {
  const links = React.useMemo(() => getLinks({ publicKey }), [publicKey]);
  return (
    <List component="nav" aria-label="controls links files">
      {links.map((l) => {
        return (
          <ListItem key={l.label} button>
            <ListItemIcon>{l.icon}</ListItemIcon>
            <Link href={l.url} target="_blank">
              {l.label}
            </Link>
          </ListItem>
        );
      })}
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

export default DashboardLinks;
