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
    marginLeft: -theme.spacing(2),
    flexGrow: 1,
  },
  listItemNotSelected: {
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
  listItem: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    borderTopRightRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius,
  },
  listItemIcon: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  divider: {
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(8),
  },
}));

interface MenuItem {
  title: string;
  icon: React.FC<{ className?: string; color: string }>;
  iconClassName: string;
  iconColor: string;
  iconSelectedColor: string;
  views: Array<CurrentView['view']>;
  notSelectedClassName: string;
  selectedClassName: string;
  className: string;
}

const toMenuItem = (
  d: MenuItem,
  currentView: CurrentView
): React.ReactElement => {
  return (
    <ListItem
      key={d.views[0]}
      className={
        `${d.views.includes(currentView.view) ? d.selectedClassName : d.notSelectedClassName} ${d.className}`
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
        style={{
          lineHeight: 1,
          margin: 0,
          textTransform: 'uppercase'
      }}>
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
    <Box
      style={{
        position: 'sticky',
      }}
    >
      <Box
        style={{
          marginTop: theme.spacing(1),
          marginBottom: theme.spacing(8),
        }}
        onClick={() => {
          void doUpdateCurrentView({ view: 'index' })();
        }}
      >
        <YCAILogo height={24} />
      </Box>

      <UserProfileBox />
      <Divider light className={classes.divider}/>

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
              notSelectedClassName: classes.listItemNotSelected,
              selectedClassName: classes.listItemSelected,
            },
            currentView
          )
        )}
      </List>
    </Box>
  );
};
