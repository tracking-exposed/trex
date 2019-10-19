import React from 'react';
import config from '../../../config';
import { Card } from 'material-ui/Card';
import $ from 'jquery';

const imgstyle = {
    width: "100%"
};
const cardStyle = {
    'textAlign': "center"
};

const InfoBox = React.createClass({

    render () {
        const personalLink = config.WEB_ROOT + '/personal/#' + this.props.publicKey;

        return (
            <Card style={cardStyle}>
                <a target='_blank' href={personalLink}>
                    <img style={imgstyle} src='/yttrex-logo.png' />
                </a>
            </Card>
        );
    }
});

export default InfoBox;
