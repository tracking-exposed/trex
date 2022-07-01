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
  render() {
    const privacy = config.WEB_ROOT + '/privacy';
    const docs = config.WEB_ROOT + '/docs';
    const code = 'https://github.com/tracking-exposed/trex';

    return (
      <Card style={{ textAlign: 'center' }}>
        <a
          target="_blank"
          href={config.WEB_ROOT}
          style={lessStandardHref}
          rel="noreferrer"
        >
          <img style={imgstyle} src="/tktrex-logo.png" />
        </a>
        <CardActions style={{ justifyContent: 'center' }}>
          <Button color="primary" href={privacy} target="_blank">
            Privacy
          </Button>
          <Button color="secondary" href={docs} target="_blank">
            Documentation
          </Button>
          <Button href={code} target="_blank">
            Code
          </Button>
        </CardActions>
      </Card>
    );
  },
});

export default InfoBox;
