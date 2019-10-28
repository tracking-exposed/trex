import React from 'react';
import InfoBox from './infoBox';
import Settings from './settings';

const styles = {
    width: "400px",
    'textAlign': "center"
};

const Popup = React.createClass({
    render () {
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
