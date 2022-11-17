import { IconButton, Tooltip } from '@mui/material';
import * as React from 'react';
import CSVIcon from '@material-ui/icons/CloudDownloadOutlined';

const CSVDownloadButton: React.FC<{ onClick: () => void }> = (props) => {
  return (
    <Tooltip title="Download CSV" placement="top">
      <IconButton size="small" onClick={props.onClick}>
        <CSVIcon color="error" />
      </IconButton>
    </Tooltip>
  );
};

export default CSVDownloadButton;
