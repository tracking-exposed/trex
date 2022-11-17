import { IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import * as React from 'react';

const DeleteButton: React.FC<{ id: string; onClick: (id: string) => void }> = (
  props
) => {
  return (
    <Tooltip title="Delete" aria-label="Delete" placement="top">
      <IconButton
        size="small"
        onClick={() => {
          props.onClick(props.id);
        }}
      >
        <DeleteIcon color="error" />
      </IconButton>
    </Tooltip>
  );
};

export default DeleteButton;
