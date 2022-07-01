/* eslint-disable */

import React from 'react';

import { Card } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';

const styles = {
  width: '400px',
};

class Tooltip extends React.Component {
  constructor(props) {
    super(props);
    console.log(proprs);
    this.state = { status: 'whatever', data: '' };
  }

  render() {
    return (
      <div style={styles}>
        <Card>
          <FormHelperText>Tooltip</FormHelperText>
        </Card>
      </div>
    );
  }
}

export default Tooltip;
