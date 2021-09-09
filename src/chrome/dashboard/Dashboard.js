import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import YCAInalitics from './YCAInalitics';
import LinkAccount from './LinkAccount';
import RecommendationsPanel from './RecommendationsPanel';
import Advanced from './Advanced';
import { invalidate } from 'avenger';
import { setCurrentVideo } from './API/commands';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  if (index !== 1) {
    setCurrentVideo(undefined, { currentVideoOnEdit: undefined })();
  }
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
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

export default function Dashboard() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
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
      <TabPanel value={value} index={0}>
        <LinkAccount />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <RecommendationsPanel />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <YCAInalitics />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Advanced />
      </TabPanel>
    </div>
  );
}
