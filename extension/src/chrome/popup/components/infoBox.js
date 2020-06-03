import React from 'react';
import config from '../../../config';
import createReactClass from 'create-react-class';

import { Card } from '@material-ui/core';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';

const imgstyle = {
    width: '100%'
};
const lessStandardHref = {
    'color': 'black',
    'textDecoration': 'none'
};
const bannerStyle = {
    'textAlign': 'center',
    'borderColor': 'black',
    'backgroundColor': '#f7f7f7',
    'borderWidth': '3px',
    'borderRadius': '3px',
    'borderStyle': 'solid',
    'padding': '2px',
};

const InfoBox = createReactClass({

    render () {
        // we might use this.props.WEB_ROOT because it is available, but, this endpoint 
        // integrity is important for security, and I'm not sure if 'props' might
        // be corrupted by some of the web-colabrodo-technology. thus, we use config: dah!
        const personalLink = config.WEB_ROOT + '/personal/#' + this.props.publicKey;

        const links = {
            'Privacy policy': 'privacy',
            'Manifesto': 'https://tracking.exposed/manifesto',
            'Join the Experiments!': 'wetest/next',
            'Software': 'https://github.com/tracking-exposed/yttrex/'
        };

        return (
            <Card>
                <a target='_blank' href={personalLink} style={lessStandardHref}>
                    <small>Access data visualizations and advanced features</small>
                  <img style={imgstyle} src='/yttrex-logo.png' />
                </a>

     <CardActions>
        <Button size="small" variant="contained" color="secondary" a="http://localhost:1313/about" href="ciao" >
          Software aa
        </Button>
        <Button size="small" color="primary" a="http://localhost:1313/privacy">
          Software repository
        </Button>
        <Button size="small" color="secondary">
          Manifesto
        </Button>
      </CardActions>



            </Card>
        );
    }
});

export default InfoBox;
