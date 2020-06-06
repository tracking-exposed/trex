import moment from 'moment';
import React from 'react';

import { Card } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';

import InfoBox from './infoBox';
import Settings from './settings';
import GetCSV from './getCSV';

import config from '../../../config';

const styles = {
    width: '400px',
};

const devColors = 'linear-gradient(to left, #f1b9b9, #a2cff7, #c8e485, #f7c4f3)';

class Popup extends React.Component {

  render () {
      if (config.NODE_ENV == 'development') { styles['backgroundImage'] = devColors; }
      const version = config.VERSION;
      const timeago = moment.duration(moment() - moment(config.BUILDISODATE)).humanize() + ' ago';

      return (
        <div style={styles}>
          <Card>
              <FormHelperText>Primary settings</FormHelperText>
              <Settings publicKey={this.props.publicKey} />
              <FormHelperText>Access to your data</FormHelperText>
              <GetCSV publicKey={this.props.publicKey} />
              <FormHelperText>About</FormHelperText>
              <InfoBox />
          </Card>
          <small>version {version}, released {timeago}</small>
        </div>
      );
    }
}

export default Popup;
