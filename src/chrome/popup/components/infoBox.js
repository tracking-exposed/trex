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
        const personalLink = config.WEB_ROOT + '/personal/' + this.props.publicKey;
        const researchLink = config.WEB_ROOT + '/research/' + this.props.publicKey;

        return (
            <Card style={cardStyle}>
                <a target='_blank' href={personalLink}>
                    <img style={imgstyle} src='/yttrex-logo.png' />
                </a>
                <a target='_blank' href={researchLink}>
                    <span>or, join a research group</span>
                </a>
            </Card>
        );
    }
});

export default InfoBox;
