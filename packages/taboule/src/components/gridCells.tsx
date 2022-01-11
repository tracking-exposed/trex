import * as React from 'react';
import { Avatar } from '@material-ui/core';
import { GridCellParams } from '@material-ui/data-grid';
import { formatDistanceToNow } from 'date-fns';

type CellRenderer = (params: GridCellParams) => React.ReactNode;

export const distanceFromNowCell: CellRenderer = (params) => {
  return formatDistanceToNow(new Date(params.formattedValue as any));
};

export const avatarCell: CellRenderer = (params) => {
  const src = params.value?.toString();
  return <Avatar src={src} />;
};
