import * as React from 'react';
import { CircularProgress } from '@material-ui/core';

export const FullSizeLoader: React.FC<{ color?: 'primary' | 'secondary' }> = ({
  color = 'primary',
}) => {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        textAlign: 'center',
        minHeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress color={color} />
    </div>
  );
};

export const LazyFullSizeLoader = (): React.ReactElement<any> => (
  <FullSizeLoader />
);
