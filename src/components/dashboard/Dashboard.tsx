import { Box, List, ListItem, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Advanced from './Advanced';
import { LinkAccount } from './LinkAccount';
import { Studio } from './studio/Studio';
import { YCAInalitics } from './YCAInalitics';
import EditIcon from '@material-ui/icons/EditSharp';
import GroupsIcon from '@material-ui/icons/GroupSharp';
import SettingsIcon from '@material-ui/icons/SettingsOutlined';
import { declareQueries } from 'avenger/lib/react';
import { currentView, doUpdateCurrentView } from '../../utils/location.utils';
import { pipe } from 'fp-ts/lib/function';
import * as QR from 'avenger/lib/QueryResult';
import { LazyFullSizeLoader } from 'components/common/FullSizeLoader';
import { ErrorBox } from 'components/common/ErrorBox';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
  },
  routesList: {
    marginTop: 100,
  },
  listItem: {
    color: theme.palette.secondary.main,
  },
  listItemIcon: {
    marginRight: 20,
  },
  diagonalBox: {
    position: 'relative',
    width: 'calc(100% - 16px)',
    height: 300,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      backgroundImage: `linear-gradient(170deg, ${theme.palette.primary.main} 50%, transparent 50%)`,
    },
  },
  diagonalBoxContent: {
    maxWidth: '50em',
    margin: '0 auto',
    position: 'relative',
  },
}));

const withQueries = declareQueries({ currentView: currentView });

export const Dashboard = withQueries(({ queries }): React.ReactElement => {
  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ currentView }) => {
      const classes = useStyles();
      const { t } = useTranslation();

      const currentViewContent = React.useMemo(() => {
        switch (currentView.view) {
          case 'community':
            return <YCAInalitics />;
          case 'settings':
            return <Advanced />;
          case 'studio':
          case 'studioEdit':
          default:
            return <Studio currentView={currentView} />;
        }
      }, [currentView]);
      return (
        <Box>
          <Grid container className={classes.root} spacing={2}>
            <Grid item md={3}>
              <Box padding={2}>
                <img alt="YCAI Logo" src="/ycai-logo.png" />

                <LinkAccount />

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
                    onClick={doUpdateCurrentView({ view: 'community' })}
                  >
                    <GroupsIcon className={classes.listItemIcon} />
                    <Typography>{t('routes:community')}</Typography>
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
              </Box>
            </Grid>
            <Grid item md={9} style={{ padding: 0 }}>
              <div className={classes.diagonalBox}>
                <div className={classes.diagonalBoxContent} />
              </div>
              {currentViewContent}
            </Grid>
          </Grid>
        </Box>
      );
    })
  );
});
