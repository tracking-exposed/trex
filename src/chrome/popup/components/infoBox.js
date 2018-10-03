import React from 'react';
import config from '../../../config';
import { Card } from 'material-ui/Card';
import $ from 'jquery';

const imgstyle = {
    width: "100%"
};
const cardStyle = {
    'textAlign': "center",
};
const h1style = {
    'fontSize': "2em",
    'color': "#65b211",
    'textUnderlinePosition': "under",
    'fontWeight': "bolder",
};
const star = {
    'color': "#fe5000"
};

const InfoBox = React.createClass({

    render () {
        const personalLink = config.WEB_ROOT + '/personal/' + this.props.publicKey;

        return (
            <Card style={cardStyle}>
                <span style={h1style}>Tailored algorithms?</span>

                <a target='_blank' href={personalLink}>
                    <img style={imgstyle} src='/youtube-trex-logo.png' />
                </a>
                <a target='_blank' href={personalLink}>
                    <span style={h1style}>try</span>
                </a>
                <span> </span>
                <a target='_blank' href={personalLink}>
                    <span style={h1style}>
                        <span style={star}> ☆ </span>
                            divergency!
                        <span style={star}> ☆ </span>
                    </span>
                </a>
            </Card>
        );
    }
});

export default InfoBox;
