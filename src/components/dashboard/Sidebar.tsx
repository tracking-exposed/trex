import {
  Box,
  List,
  ListItem,
  makeStyles,
  Typography,
  useTheme,
  Divider,
} from '@material-ui/core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CurrentView, doUpdateCurrentView } from 'utils/location.utils';
import { UserProfileBox } from './UserProfileBox';
import LabIcon from '../common/icons/LabIcon';
import AnalyticsIcon from '../common/icons/AnalyticsIcon';
import SettingsIcon from '../common/icons/SettingsIcon';
import YCAILogo from 'components/common/YCAILogo';


const useStyles = makeStyles((theme) => ({
  routesList: {
    marginTop: 60,
  },
  listItem: {
    color: theme.palette.primary.main,
  },
  listItemSelected: {
    color: theme.palette.violet.contrastText,
    backgroundColor: `${theme.palette.grey[500]}`,
    '&:hover': {
      backgroundColor: `${theme.palette.grey[500]}`,
      opacity: 0.8,
    },
  },
  listItemIcon: {
    marginRight: 40,
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
      key={d.views[0]}
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
      <Typography
        variant="subtitle2"
        style={{ margin: 0, textTransform: 'uppercase' }}
      >
        {d.title}
      </Typography>
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
      <Box
        style={{
          paddingTop: theme.spacing(4),
          paddingRight: theme.spacing(10),
          marginBottom: theme.spacing(6),
        }}
        onClick={() => {
          void doUpdateCurrentView({ view: 'index' })();
        }}
      >
        <YCAILogo width={'50%'} />
      </Box>

      <Box style={{ padding: theme.spacing(2) }}>
        <UserProfileBox />
      </Box>

      <Box style={{ padding: theme.spacing(2) }}>
      <Divider light />
      </Box>

      <List className={classes.routesList} disablePadding={true}>
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
