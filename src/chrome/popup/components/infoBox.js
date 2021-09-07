import React from 'react';
import config from '../../../config';
import createReactClass from 'create-react-class';

import { Card } from '@material-ui/core';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';

const InfoBox = createReactClass({

    render () {
        const about = '/dashboard.html';
        const privacy = config.WEB_ROOT + '/privacy';
        const experiments = config.WEB_ROOT + '/wetest/next';

        return (
            <Card style={{'textAlign':'center'}}>
              <CardActions style={{'textAlign':'center'}}>
                <Button size="medium" color="secondary" href={about} target="_blank">
                  Dashboard
                </Button>
              </CardActions>
            </Card>
        );
    }
});

export default InfoBox;
