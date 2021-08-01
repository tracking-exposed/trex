import React from 'react';
import FormHelperText from '@material-ui/core/FormHelperText';


const divStyles = {
  width: '100%',
  paddingLeft: "10%",
};

class Divider extends React.Component{
  /* this element might have the helper text and the horizonal dividing tow */
    render () {
        return (
          <div style={divStyles} >
            <FormHelperText>{this.props.helperText}</FormHelperText>
            <br />
          </div>
        );
    }
};

export default Divider;
