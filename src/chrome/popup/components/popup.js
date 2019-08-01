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
                <p>You are partecipating in 
                    <span> </span>
                    <a href='https://youtube.tracking.exposed'>ytTREX</a>,
                    <span> </span>
                    <a href='https://tracking.exposed'>manifesto</a>,
                    <span> </span>
                    access to your collected data:
                </p>
                <InfoBox {...this.props} />
            </div>
        );
    }
    //            <Settings {...this.props} />
});

export default Popup;
