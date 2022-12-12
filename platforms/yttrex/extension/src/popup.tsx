import {
  AccountBox as AccountBoxIcon,
  OndemandVideo as OndemandVideoIcon,
  SearchOutlined,
  StayCurrentLandscape as StayCurrentLandscapeIcon,
} from '@material-ui/icons';
import config from '@shared/extension/config';
import { renderPopup } from '@shared/extension/popup';
import * as React from 'react';
import ytHub from './handlers/hub';

renderPopup({
  platform: 'YouTube',
  platformURL: 'https://youtube.com',
  logo: '/yttrex-logo.png',
  hub: ytHub,
  settings: {
    enabled: {
      researchTag: true,
      experimentId: true,
    },
  },
  getLinks: ({ publicKey }) => {
    const homecsv = `${config.API_ROOT}/v2/personal/${publicKey}/home/csv`;
    const videocsv = `${config.API_ROOT}/v2/personal/${publicKey}/video/csv`;
    const searchescsv = `${config.API_ROOT}/v2/personal/${publicKey}/searches/csv`;
    const personalLink = `${config.WEB_ROOT}/personal/#${publicKey}`;

    return [
      {
        icon: <AccountBoxIcon />,
        url: personalLink,
        label: 'Evidence Log',
      },
      {
        url: homecsv,
        label: 'CSV (Homepage)',
        icon: <StayCurrentLandscapeIcon />,
      },
      {
        icon: <OndemandVideoIcon />,
        url: videocsv,
        label: 'CSV (Recommended/Related)',
      },
      {
        icon: <SearchOutlined />,
        url: searchescsv,
        label: 'CSV (Search results)',
      },
    ];
  },
});
