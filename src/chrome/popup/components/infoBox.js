import React from 'react';
import config from '../../../config';
import { Card, CardHeader, CardTitle, CardText } from 'material-ui/Card';

const InfoBox = React.createClass({

    render () {
        const personalLink = config.WEB_ROOT + '/personal/' + this.props.cookieId;
        console.log(personalLink);

        return (
            <Card>
                <CardHeader
                    title='Scientifical experiment in progress!' />

                <CardText>
                    Remind: with this extension running, the youtube videos suggested by youtube algorithm, are recorded for <b>algorithm accountability</b> and <b>social media accountability</b> purposes only.
                    <br/>
                    <br/>
                    Check <a href={personalLink}>your submitted data</a>.
                </CardText> 
            </Card>
        );
    }

});

export default InfoBox;
