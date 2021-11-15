import {
  List,
  ListItem,
  makeStyles,
  Typography,
  useTheme,
} from '@material-ui/core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CurrentView, doUpdateCurrentView } from 'utils/location.utils';
import { UserProfileBox } from './UserProfileBox';
import LabIcon from '../common/icons/LabIcon';
import AnalyticsIcon from '../common/icons/AnalyticsIcon';
import SettingsIcon from '../common/icons/SettingsIcon';

const useStyles = makeStyles((theme) => ({
  routesList: {
    marginTop: 100,
  },
  listItem: {
    color: theme.palette.primary.main,
  },
  listItemSelected: {
    color: theme.palette.violet.contrastText,
    backgroundColor: `${theme.palette.violet.dark}`,
    '&:hover': {
      backgroundColor: `${theme.palette.violet.dark}`,
      opacity: 0.6,
    },
  },
  listItemIcon: {
    marginRight: 20,
  },
}));

interface MenuItem {
  title: string;
  icon: React.FC<{ className?: string; color: string }>;
  iconClassName: string;
  iconColor: string;
  iconSelectedColor: string;
  views: Array<CurrentView['view']>;
  className: string;
  selectedClassName: string;
}

const toMenuItem = (
  d: MenuItem,
  currentView: CurrentView
): React.ReactElement => {
  return (
    <ListItem
      className={
        d.views.includes(currentView.view) ? d.selectedClassName : d.className
      }
      button={true}
      onClick={doUpdateCurrentView({ view: d.views[0] as any })}
    >
      <d.icon
        className={d.iconClassName}
        color={
          d.views.includes(currentView.view) ? d.iconSelectedColor : d.iconColor
        }
      />
      <Typography>{d.title}</Typography>
    </ListItem>
  );
};

interface SidebarProps {
  currentView: CurrentView;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView }) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const theme = useTheme();
  return (
    <div style={{ height: '100%' }}>
      <img
        alt="YCAI Logo"
        src="/ycai-logo.png"
        style={{ width: '100%', marginBottom: 50 }}
        onClick={() => {
          void doUpdateCurrentView({ view: 'index' })();
        }}
      />
      <UserProfileBox />
      <List className={classes.routesList}>
        {[
          {
            title: t('routes:lab_title_short'),
            icon: LabIcon,
            views: ['lab', 'labEdit'] as Array<CurrentView['view']>,
          },
          {
            title: t('routes:statistics'),
            icon: AnalyticsIcon,
            views: ['statistics'] as Array<CurrentView['view']>,
          },
          {
            title: t('routes:settings'),
            icon: SettingsIcon,
            views: ['settings'] as Array<CurrentView['view']>,
          },
        ].map((opts) =>
          toMenuItem(
            {
              ...opts,
              iconClassName: classes.listItemIcon,
              iconColor: theme.palette.primary.main,
              iconSelectedColor: theme.palette.common.white,
              className: classes.listItem,
              selectedClassName: classes.listItemSelected,
            },
            currentView
          )
        )}
      </List>
    </div>
  );
};
