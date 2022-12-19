import { IconButton, Tooltip } from '@mui/material';
import * as React from 'react';
import RefreshIcon from '@mui/icons-material/RefreshOutlined';

const RefreshButton: React.FC<{ onClick: () => void }> = (props) => {
  return (
    <Tooltip title="Refresh" placement="top">
      <IconButton size="small" onClick={props.onClick}>
        <RefreshIcon color="error" />
      </IconButton>
    </Tooltip>
  );
};

export default RefreshButton;
