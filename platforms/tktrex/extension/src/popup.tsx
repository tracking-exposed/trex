import { renderPopup } from '@shared/extension/popup';
import config from '@shared/extension/config';
import {
  StayCurrentLandscape as StayCurrentLandscapeIcon,
  // OndemandVideo as OndemandVideoIcon,
  AccountBox as AccountBoxIcon,
} from '@material-ui/icons';
import * as React from 'react';

renderPopup({
  platform: 'TikTok',
  logo: '/tktrex-logo.png',
  getLinks: ({ publicKey }) => {
    const personalLink = `${config.WEB_ROOT}/personal/#${publicKey}`;
    const PersonalSearchCSV = `${config.API_ROOT}/v2/personal/${publicKey}/search/csv`;
    // const videoCSV = `${config.API_ROOT}/personal/${publicKey}/video/csv`;

    return [
      {
        url: personalLink,
        label: 'Evidence Log',
        icon: <AccountBoxIcon />,
      },
      {
        url: PersonalSearchCSV,
        label: 'Download Your Searches (CSV)',
        icon: <StayCurrentLandscapeIcon />,
      },
      // kept only Personal Search CSV in popup
      // {
      //   url: videoCSV,
      //   label: 'Download ForYou Video (CSV)',
      //   icon: <OndemandVideo />
      // }
    ];
  },
});
