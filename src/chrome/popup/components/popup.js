import React from 'react';
import InfoBox from './infoBox';
import Settings from './settings';

const styles = {
    width: "400px",
    'textAlign': "right"
};

const Popup = React.createClass({
    render () {
        return (
            <div style={styles}>
                <p>Service managed by 
                    <span> </span>
                    <a href='https://youtube.tracking.exposed'>ytTREX</a>,
                    <span> </span>
                    <a href='https://tracking.exposed'>manifesto</a>,
                    <span> </span>
                    <a href='https://github.com/tracking-exposed/ytTREX'>code</a>
                </p>
                <InfoBox {...this.props} />
            </div>
        );
    }
    //            <Settings {...this.props} />
});

export default Popup;
