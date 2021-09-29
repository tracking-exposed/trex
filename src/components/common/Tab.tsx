import { Typography } from '@material-ui/core';
import MUITab, { TabProps as MUITabProps } from '@material-ui/core/Tab';
import * as React from 'react';

function a11yProps(index: number): { [key: string]: string } {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

interface TabProps extends MUITabProps {
  index: number;
}

export const Tab: React.FC<TabProps> = ({ label, ...props }) => {
  return (
    <MUITab
      {...props}
      {...a11yProps(props.index)}
      label={<Typography variant="caption">{label}</Typography>}
    />
  );
};
