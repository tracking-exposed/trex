import React from 'react';

import { Card } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';

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