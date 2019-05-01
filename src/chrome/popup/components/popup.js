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
                <p>An experiment offered by 
                    <span> </span>
                    <a href='https://youtube.tracking.exposed'>ytTREX</a>,
                    <span> </span>
                    <a href='https://tracking.exposed'>manifesto</a>,
                    <span> </span>
                    <a href='https://github.com/tracking-exposed/ytTREX'>code</a>, control your data:
                </p>
                <InfoBox {...this.props} />
            </div>
        );
    }
    //            <Settings {...this.props} />
});

export default Popup;
