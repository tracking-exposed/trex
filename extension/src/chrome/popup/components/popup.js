import moment from 'moment';
import React from 'react';

import { Card } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import FormHelperText from '@material-ui/core/FormHelperText';

import InfoBox from './infoBox';
import Settings from './settings';
import GetCSV from './getCSV';

import config from '../../../config';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

const styles = {
    width: '400px',
};

class Popup extends React.Component{

  constructor (props) {
      super(props);
      this.state = { status: 'fetching' };
      try {
        bo.runtime.sendMessage({ type: 'localLookup' }, (userSettings) => {
          console.log("here got", userSettings);
          if(userSettings && userSettings.publicKey)
            this.setState({ status: 'done', data: userSettings });
          else
            this.setState({ status: 'error', data: userSettings });
        });
      } catch(e) {
        console.log("catch error", e.message, runtime.lastError);
        this.state = { status: 'error', data: ''};
      }
    }

  render () {
      const version = config.VERSION;
      const timeago = moment.duration(moment() - moment(config.BUILDISODATE)).humanize() + ' ago';

      if(!this.state)
        return (<div>Loading...</div>)

      console.log('popup props status', this.props, this.state);

      if(this.state.status !== 'done') {
        console.log("Incomplete info before render");
        return (
          <div style={styles}>
            <Card>
                <Alert severity="error">
                    <AlertTitle>Error</AlertTitle>
                    Extension isn't initialized yet — <strong>Access <a href="https://www.youtube.com" target="_blank">yutube.com</a>.</strong>
                </Alert>
                <InfoBox />
            </Card>
          </div>
        );
      }

      return (
        <div style={styles}>
          <Card>
              <FormHelperText>ytTREX main switch</FormHelperText>
              <Settings active={this.state.data.active} />
              <FormHelperText>Access to your data</FormHelperText>
              <GetCSV publicKey={this.state.data.publicKey } />
              <FormHelperText>About</FormHelperText>
              <InfoBox />
          </Card>
          <small>version {version}, released {timeago}</small>
        </div>
      );
    }
}

export default Popup;
