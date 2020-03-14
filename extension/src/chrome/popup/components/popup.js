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
                <p> — Click on the logo to access your data — </p>
                <InfoBox {...this.props} />
                <smaller>This is
                    <span> </span>
                    <a target="_blank" href="https://github.com/tracking-exposed/yttrex/">
                        free software
                    </a>, the 
                    <span> </span>
                    <a target="_blank" href='https://tracking.exposed/manifesto'>Manifesto</a>, or
                    <span> </span>
                    <a target="_blank" href="https://youtube.tracking.exposed/wetest/next">Play with us!</a>
                </smaller>
            </div>
        );
    }
});

export default Popup;
