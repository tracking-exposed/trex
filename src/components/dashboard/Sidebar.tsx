import {
  Grid,
  List,
  ListItem,
  makeStyles,
  Typography,
} from '@material-ui/core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { doUpdateCurrentView } from 'utils/location.utils';
import { UserProfileBox } from './UserProfileBox';
import EditIcon from '@material-ui/icons/EditSharp';
import GroupsIcon from '@material-ui/icons/GroupSharp';
import SettingsIcon from '@material-ui/icons/SettingsOutlined';

const useStyles = makeStyles((theme) => ({
  routesList: {
    marginTop: 100,
  },
  listItem: {
    color: theme.palette.secondary.main,
  },
  listItemIcon: {
    marginRight: 20,
  },
}));

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  return (
    <Grid container style={{ height: '100%' }}>
      <Grid item>
        <img
          alt="YCAI Logo"
          src="/ycai-logo.png"
          onClick={() => {
            void doUpdateCurrentView({ view: 'index' })();
          }}
        />
        <UserProfileBox />
        <List className={classes.routesList}>
          <ListItem
            className={classes.listItem}
            button={true}
            onClick={doUpdateCurrentView({ view: 'studio' })}
          >
            <EditIcon className={classes.listItemIcon} />
            <Typography>{t('routes:studio')}</Typography>
          </ListItem>
          <ListItem
            className={classes.listItem}
            button={true}
            onClick={doUpdateCurrentView({ view: 'statistics' })}
          >
            <GroupsIcon className={classes.listItemIcon} />
            <Typography>{t('routes:statistics')}</Typography>
          </ListItem>
          <ListItem
            className={classes.listItem}
            button={true}
            onClick={doUpdateCurrentView({ view: 'settings' })}
          >
            <SettingsIcon className={classes.listItemIcon} />
            <Typography>{t('routes:settings')}</Typography>
          </ListItem>
        </List>
      </Grid>
    </Grid>
  );
};
