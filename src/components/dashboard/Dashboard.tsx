import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import React from 'react';
import Advanced from './Advanced';
import { Tab} from '../common/Tab';
import { TabPanel } from '../common/TabPanel';
import { LinkAccount } from './LinkAccount';
import { ManageVideosPanel } from './ManageVideosPanel';
import { YCAInalitics } from './YCAInalitics';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));

export const Dashboard: React.FC = () => {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: any, newValue: number): void => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <img alt="YCAI Logo" src="/ycai-logo.png" />
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="simple tabs example"
        >
          <Tab label="Link your account" index={0} />
          <Tab label="Manage recommendations" index={1} />
          <Tab label="Collaborative Analytics" index={2} />
          <Tab label="Advanced Settings" index={3} />
        </Tabs>
      </AppBar>
      <Grid container>
        <Grid item md={12}>
          <TabPanel value={value} index={0}>
            <LinkAccount />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <ManageVideosPanel />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <YCAInalitics />
          </TabPanel>
          <TabPanel value={value} index={3}>
            <Advanced />
          </TabPanel>
        </Grid>
      </Grid>
    </div>
  );
};
