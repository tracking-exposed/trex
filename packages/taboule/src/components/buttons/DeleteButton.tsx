import { IconButton, Tooltip } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
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
