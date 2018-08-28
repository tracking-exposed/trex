import React from 'react';
import InfoBox from './infoBox';
import Settings from './settings';

const styles = {
    width: "400px"
};

const Popup = React.createClass({

    render () {
        return (
            <div style={styles}>
                <InfoBox {...this.props} />
                <Settings {...this.props} />
            </div>
        );
    }
});

export default Popup;
