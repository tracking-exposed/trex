import { Box } from '@material-ui/core';
import { ErrorBox } from '@shared/components/Error/ErrorBox';
import * as React from 'react';

export const ErrorOverlay: React.FC<Error> = (error) => {
  return (
    <Box
      display={'flex'}
      alignContent={'center'}
      width={'100%'}
      alignSelf={'center'}
      alignItems={'center'}
      style={{
        height: '100%',
      }}
    >
      <Box
        style={{
          margin: 'auto',
          width: '100%',
        }}
      >
        {ErrorBox(error)}
      </Box>
    </Box>
  );
};
