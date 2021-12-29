import React from 'react';
import config from '../../../config';
import createReactClass from 'create-react-class';

import { Card } from '@material-ui/core';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';

const imgstyle = {
  width: '100%',
};
const lessStandardHref = {
  color: 'black',
  textDecoration: 'none',
};

const InfoBox = createReactClass({

  render () {
    const about = config.WEB_ROOT + '/about';
    const privacy = config.WEB_ROOT + '/privacy';
    const services = config.WEB_ROOT + '/services';

    return (
      <Card style={{'textAlign':'center'}}>
        <a target='_blank' href={config.WEB_ROOT} style={lessStandardHref} rel="noreferrer">
          <img style={imgstyle} src='/tktrex-logo.png' />
        </a>
        <CardActions>
          <Button size="small" color="secondary" href={about} target="_blank">
                  Project
          </Button>
          <Button size="small" color="primary" href={privacy} target="_blank">
                  Privacy 
          </Button>
          <Button size="small" color="secondary" href="https://tracking.exposed/manifesto" target="_blank">
                  Manifesto
          </Button>
          <Button size="small" color="primary"  href="https://github.com/tracking-exposed/tktrex/" target="_blank"> 
                  Software
          </Button>
          <Button size="small" color="secondary"  href={services} target="_blank"> 
                  Services
          </Button>
        </CardActions>
      </Card>
    );
  },
});

export default InfoBox;
