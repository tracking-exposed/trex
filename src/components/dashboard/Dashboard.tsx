import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import React from 'react';
import Advanced from './Advanced';
import { TabPanel } from '../TabPanel';
import { LinkAccount } from './LinkAccount';
import { ManageVideosPanel } from './ManageVideosPanel';
import { YCAInalitics } from './YCAInalitics';

function a11yProps(index: number): { [key: string]: string } {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

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
          <Tab label="Link your account" {...a11yProps(0)} />
          <Tab label="Manage recommendations" {...a11yProps(1)} />
          <Tab label="Collaborative Analytics" {...a11yProps(2)} />
          <Tab label="Advanced Settings" {...a11yProps(3)} />
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
