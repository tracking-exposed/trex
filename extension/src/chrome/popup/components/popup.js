import moment from 'moment';
import React from 'react';

import InfoBox from './infoBox';
import Settings from './settings';
import config from '../../../config';

const styles = {
    width: '400px',
    'textAlign': 'center'
};

const devColors = 'linear-gradient(to left, #f1b9b9, #a2cff7, #c8e485, #f7c4f3)';

const Popup = React.createClass({
    render () {

        if (config.NODE_ENV == 'development') { styles['backgroundImage'] = devColors; }
        const version = config.VERSION;
        console.log(config);
        const timeago = moment.duration(moment() - moment(config.BUILDISODATE)).humanize() + ' ago';

        return (
            <div style={styles}>
                <InfoBox {...this.props} />
                <Settings />
                <small>version {version}, released {timeago}</small>
            </div>
        );
    }
});

export default Popup;
