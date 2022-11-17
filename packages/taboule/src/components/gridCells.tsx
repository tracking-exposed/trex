import * as React from 'react';
import { Avatar } from '@mui/material';
import { GridCellParams } from '@mui/x-data-grid';
import { formatDistanceToNow } from 'date-fns';

type CellRenderer = (params: GridCellParams) => React.ReactNode;

export const distanceFromNowCell: CellRenderer = (params) => {
  return formatDistanceToNow(new Date(params.formattedValue));
};

export const avatarCell: CellRenderer = (params) => {
  const src = params.value?.toString();
  return <Avatar src={src} />;
};
