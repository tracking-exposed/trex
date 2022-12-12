import { Box } from '@material-ui/core';
import * as React from 'react';
import { APIInterceptedSnackbar } from './APIInterceptedSnackbar';
import { SigiStateSnackbar } from './SigiStateSnackbar';
import { addPageUI } from '@shared/extension/ui';

export const addTKAppUI = (): void => {
  return addPageUI(
    'tktrex-app-ui',
    <Box style={{ position: 'fixed' }}>
      <APIInterceptedSnackbar />
      <SigiStateSnackbar />
    </Box>,
  );
};
