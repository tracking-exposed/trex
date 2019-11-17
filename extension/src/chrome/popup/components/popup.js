import React from 'react';
import InfoBox from './infoBox';
import Settings from './settings';
import config from '../../../config';

const styles = {
    width: "400px",
    'textAlign': "center"
};

const devColors = "linear-gradient(to left, #f1b9b9, #a2cff7, #c8e485, #f7c4f3)";

const Popup = React.createClass({
    render () {

        if(config.NODE_ENV == 'development')
            styles['background-image'] = devColors;

        return (
            <div style={styles}>
                <p>
                    <a target="_blank" href='https://tracking.exposed'>Tracking Exposed</a> 
                    <span> </span>
                    — 
                    <span> </span>
                    access to your data:
                </p>
                <InfoBox {...this.props} />
                <smaller>Running on 
                    <span> </span>
                    <a target="_blank" href="https://github.com/tracking-exposed/yttrex/">
                        free software
                    </a>, we welcome contributions.
                </smaller>
            </div>
        );
    }
    //            <Settings {...this.props} />
});

export default Popup;
