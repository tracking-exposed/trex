import React from 'react';
import config from '../../../config';
import { Card } from 'material-ui/Card';
import $ from 'jquery';

const imgstyle = {
    width: '100%'
};
const cardStyle = {
    'textAlign': 'center'
};

const InfoBox = React.createClass({

    render () {
        const personalLink = config.WEB_ROOT + '/personal/#' + this.props.publicKey;

        return (
            <Card style={cardStyle}>
                <a target='_blank' href={personalLink}>
                    <p> — Access your data — </p>
                </a>

                <a target='_blank' href={personalLink}>
                    <img style={imgstyle} src='/yttrex-logo.png' />
                </a>

               <smaller>This is
                    <span> </span>
                    <a target="_blank" href="https://github.com/tracking-exposed/yttrex/">
                        free software
                    </a>. 
                    <span> </span>
                    <a target="_blank" href='https://youtube.tracking.exposed/privacy'>Privacy</a> policy, 
                    <span> </span>, our <span> </span>
                    <a target="_blank" href='https://tracking.exposed/manifesto'>Manifesto</a>.
                    <span> </span> and the <span> </span>
                    <a target="_blank" href="https://youtube.tracking.exposed/wetest/next">Experiments!</a>
                </smaller>

            </Card>
        );
    }
});

export default InfoBox;
