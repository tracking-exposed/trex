import React from 'react';
import { Card, CardHeader, CardTitle, CardText } from 'material-ui/Card';

const bo = chrome || browser;

const InfoBox = React.createClass({
    render () {
        return (
            <Card>
                <CardHeader
                    title='Scientifical experiment in progress!' />

                <CardText>
                    Remind: with this extension running, the youtube videos suggested by youtube algorithm, are recorded for <b>algorithm accountability</b> and <b>social media accountability</b> purposes only
                </CardText> 
            </Card>
        );
    }

});

export default InfoBox;
