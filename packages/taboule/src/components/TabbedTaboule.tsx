import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import * as React from 'react';
import { TabouleQueries } from '../state/queries';
import { Taboule, TabouleProps } from './Taboule';
import { a11yProps, TabPanel } from './TabPanel';

interface TabbedTabouleProps<Q extends keyof TabouleQueries>
  extends Omit<TabouleProps<Q>, 'query'> {
  queries: Array<{
    label: string;
    value: Q;
  }>;
}

export const TabbedTaboule: React.FC<
  TabbedTabouleProps<keyof TabouleQueries>
> = ({ queries: tabs, ...props }) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (
    event: React.SyntheticEvent,
    newValue: number
  ): void => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          {tabs.map((t, i) => (
            <Tab
              key={t.value}
              label={t.label}
              {...a11yProps(i)}
              style={{ marginLeft: 10, marginR: 10 }}
            />
          ))}
        </Tabs>
      </Box>

      {tabs.map((t, i) => (
        <TabPanel key={t.value} value={value} index={i}>
          <Taboule {...props} query={t.value} />
        </TabPanel>
      ))}
    </Box>
  );
};
