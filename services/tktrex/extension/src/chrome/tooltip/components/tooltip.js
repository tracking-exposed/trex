import React from 'react';

const styles = {
    width: '400px'
};

class Tooltip extends React.Component {
  constructor (props) {
      super(props);
      this.state = { status: 'whatever', data: ''};
  }

  render () {
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
