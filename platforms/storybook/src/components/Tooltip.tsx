import React from 'react';
import { Card, FormHelperText } from '@mui/material';

interface TooltipProps {
  tooltipText: string;
}

const styles = {
  width: '400px',
};

export const Tooltip: React.FC<TooltipProps> = ({
  tooltipText = 'tooltip',
}) => (
  <div style={styles}>
    <Card>
      <FormHelperText>{tooltipText}</FormHelperText>
    </Card>
  </div>
);
