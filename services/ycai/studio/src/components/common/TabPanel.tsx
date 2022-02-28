import * as React from 'react';
import { TabPanelProps as MUITabPanelProps } from '@material-ui/lab/TabPanel';
import { Box } from '@material-ui/core';

type TabPanelProps = Omit<MUITabPanelProps, 'value' | 'ref'> &
  (
    | {
        index: number;
        value: number;
      }
    | {
        index: string;
        value: string;
      }
  );

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
      {value === index && (
        <Box p={3} padding={0}>
          {children}
        </Box>
      )}
    </div>
  );
};
