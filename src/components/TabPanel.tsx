import * as React from 'react';
import { TabPanelProps as MUITabPanelProps } from '@material-ui/lab/TabPanel';
import { Box } from '@material-ui/core';

interface TabPanelProps extends Omit<MUITabPanelProps, 'value' | 'ref'> {
  index: number;
  value: number;
}

export const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

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
};
