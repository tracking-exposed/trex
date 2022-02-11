import {
  Box,
  Divider,
  List,
  ListItem,
  makeStyles,
  Typography,
  useTheme,
} from '@material-ui/core';
import { ContentCreator } from '@shared/models/ContentCreator';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CurrentView, doUpdateCurrentView } from '../../utils/location.utils';
import AnalyticsIcon from '../common/icons/AnalyticsIcon';
import LabIcon from '../common/icons/LabIcon';
import SettingsIcon from '../common/icons/SettingsIcon';
import YCAILogo from '../common/YCAILogo';
import { UserProfileBox } from './UserProfileBox';

const useStyles = makeStyles((theme) => ({
  routesList: {
    marginLeft: -theme.spacing(2),
    flexGrow: 1,
  },
  divider: {
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(8),
  },
  listItem: {
    padding: 0,
  },
  listItemNotSelected: {
    color: theme.palette.primary.main,
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  listItemSelected: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    color: theme.palette.violet.contrastText,
    borderTopRightRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius,
    backgroundColor: `${theme.palette.grey[500]}`,
    '&:hover': {
      backgroundColor: `${theme.palette.grey[500]}`,
      opacity: 0.8,
    },
  },
  listItemIcon: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  listItemText: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  subItems: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(3),
    marginLeft: theme.spacing(8),
    marginRight: theme.spacing(2),
    width: `calc(100% - ${theme.spacing(8) + theme.spacing(2)}px)`,
  },
  subListItem: {
    color: theme.palette.grey[400],
    marginTop: theme.spacing(3),
  },
  subListItemSelected: {
    color: theme.palette.violet.main,
  },
  subItemsDivider: {
    marginTop: theme.spacing(2),
  },
}));

interface MenuItem {
  title: string;
  icon: React.FC<{ className?: string; color: string }>;
  views: Array<CurrentView['view']>;
  subItems: Array<Omit<MenuItem, 'icon' | 'subItems'>>;
}

const MenuBox: React.FC<{ currentView: CurrentView }> = ({ currentView }) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const theme = useTheme();

  const menuItems = React.useMemo((): MenuItem[] => {
    return [
      {
        title: t('routes:lab_title_short'),
        icon: LabIcon,
        views: ['lab', 'labEdit', 'gemCollection'] as Array<
          CurrentView['view']
        >,
        subItems: [
          {
            title: t('routes:gem_collection_title_short'),
            views: ['gemCollection'],
          },
          {
            title: t('routes:lab_videos_title'),
            views: ['lab', 'labEdit'],
          },
        ],
      },
      {
        title: t('routes:analytics'),
        icon: AnalyticsIcon,
        views: ['analytics'] as Array<CurrentView['view']>,
        subItems: [],
      },
      {
        title: t('routes:settings'),
        icon: SettingsIcon,
        views: ['settings'] as Array<CurrentView['view']>,
        subItems: [],
      },
    ];
  }, []);

  return (
    <List className={classes.routesList} disablePadding={true}>
      {menuItems.map((menuItem) => {
        return (
          <ListItem
            key={menuItem.views[0]}
            className={classes.listItem}
            button={true}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <Box
              display={'flex'}
              flexDirection="row"
              alignItems={'center'}
              width={'100%'}
              className={
                menuItem.views.includes(currentView.view)
                  ? classes.listItemSelected
                  : classes.listItemNotSelected
              }
              onClick={doUpdateCurrentView({ view: menuItem.views[0] as any })}
            >
              <menuItem.icon
                className={classes.listItemIcon}
                color={
                  menuItem.views.includes(currentView.view)
                    ? theme.palette.common.white
                    : theme.palette.primary.main
                }
              />
              <Typography
                variant="subtitle2"
                style={{
                  lineHeight: 1,
                  margin: 10,
                  textTransform: 'uppercase',
                }}
              >
                {menuItem.title}
              </Typography>
            </Box>

            {menuItem.subItems.length > 0 ? (
              <Box className={classes.subItems}>
                {menuItem.subItems.map((si) => (
                  <Box
                    key={si.title}
                    className={`${
                      si.views.includes(currentView.view)
                        ? classes.subListItemSelected
                        : classes.subListItem
                    } ${classes.subListItem}`}
                    onClick={() => {
                      void doUpdateCurrentView({ view: si.views[0] as any })();
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      style={{
                        lineHeight: 1,
                        margin: 0,
                      }}
                    >
                      {si.title}
                    </Typography>
                  </Box>
                ))}
                <Divider className={classes.subItemsDivider} />
              </Box>
            ) : null}
          </ListItem>
        );
      })}
    </List>
  );
};

interface SidebarProps {
  currentView: CurrentView;
  profile?: ContentCreator;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, profile }) => {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <Box
      style={{
        position: 'sticky',
        top: theme.spacing(3),
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

      {profile && (
        <>
          <UserProfileBox />

          <Divider light className={classes.divider} />

          <MenuBox currentView={currentView} />
        </>
      )}
    </Box>
  );
};
