/* eslint-disable */

import moment from 'moment';
import React from 'react';

import { Card } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import FormHelperText from '@material-ui/core/FormHelperText';

import InfoBox from './InfoBox';
import Settings from './settings';
import GetCSV from './getCSV';
import { bo } from '@shared/extension/utils/browser.utils';
import config from '@shared/extension/config';

const styles = {
  width: '100%',
};

class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { status: 'fetching' };
    // this is redundant
    try {
      bo.runtime.sendMessage(
        { type: 'LocalLookup', payload: { userId: 'local' } },
        (userSettings) => {
          console.log('here got', userSettings);
          if (userSettings && userSettings.publicKey)
            this.setState({ status: 'done', data: userSettings });
          else this.setState({ status: 'error', data: userSettings });
        }
      );
    } catch (e) {
      console.log('catch error', e.message, runtime.lastError);
      this.state = { status: 'error', data: '' };
    }
  }

  render() {
    const version = config.VERSION;
    const timeago =
      moment.duration(moment() - moment(config.BUILD_DATE)).humanize() + ' ago';

    if (!this.state) return <div>Loading...</div>;

    console.log('popup props status', this.props, this.state);

    if (this.state.status !== 'done') {
      console.log('Incomplete info before render');
      return (
        <div style={styles}>
          <Card>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              Extension isn't initialized yet —{' '}
              <strong>
                Access{' '}
                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  youtube.com
                </a>
                .
              </strong>
            </Alert>
            <InfoBox />
          </Card>
        </div>
      );
    }

    return (
      <div style={styles}>
        <Card>
          <Settings {...this.state.data} />
          <FormHelperText>Access to your data</FormHelperText>
          <GetCSV publicKey={this.state.data.publicKey} />
          <FormHelperText>About</FormHelperText>
          <InfoBox version={version} timeago={timeago} />
        </Card>
      </div>
    );
  }
}

export default Popup;
