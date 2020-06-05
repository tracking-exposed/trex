import moment from 'moment';
import React from 'react';
import createReactClass from 'create-react-class';

import { Card } from '@material-ui/core';
import FormHelperText from '@material-ui/core/FormHelperText';

import InfoBox from './infoBox';
import Settings from './settings';
import GetCSV from './getCSV';

import config from '../../../config';

const bo = chrome || browser;

const styles = {
    width: '400px',
};

const devColors = 'linear-gradient(to left, #f1b9b9, #a2cff7, #c8e485, #f7c4f3)';

const Popup = createReactClass({
    render () {

        if (config.NODE_ENV == 'development') { styles['backgroundImage'] = devColors; }
        const version = config.VERSION;
        const timeago = moment.duration(moment() - moment(config.BUILDISODATE)).humanize() + ' ago';

        return (
            <div style={styles}>
              <Card>
                  <FormHelperText>Primary settings</FormHelperText>
                  <Settings {...this.props}{...config} />
                  <FormHelperText>Access to your data</FormHelperText>
                  <GetCSV {...this.props} />
                  <FormHelperText>About</FormHelperText>
                  <InfoBox {...this.props}{...config} />
              </Card>
              <small>version {version}, released {timeago}</small>
            </div>
        );
        /* version and released are outside the <Card> because this way the rought
         * style apply only to them in the footer */
    }
});

export default Popup;
