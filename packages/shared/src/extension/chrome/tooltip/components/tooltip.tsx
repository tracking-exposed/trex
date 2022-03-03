import React from 'react';

import { Card } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';

const styles = {
  width: '400px',
};

const Tooltip: React.FC = () => (
  <div style={styles}>
    <Card>
      <FormHelperText>Tooltip</FormHelperText>
    </Card>
  </div>
);

export default Tooltip;
