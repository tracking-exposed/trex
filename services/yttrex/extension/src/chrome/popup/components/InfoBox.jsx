import React from 'react';
import config from '../../../config';

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

const InfoBox = () => {
  const about = config.WEB_ROOT + '/about';
  const privacy = config.WEB_ROOT + '/privacy';
  const guardonihref = config.WEB_ROOT + '/guardoni';

  return (
    <Card style={{ textAlign: 'center' }}>
      <a target="_blank" href={config.WEB_ROOT} style={lessStandardHref}>
        <img style={imgstyle} src="/yttrex-logo.png" />
      </a>
      <CardActions>
        <Button size="small" color="secondary" href={about} target="_blank">
          Project
        </Button>
        <Button size="small" color="primary" href={privacy} target="_blank">
          Privacy
        </Button>
        <Button
          size="small"
          color="secondary"
          href="https://tracking.exposed/manifesto"
          target="_blank"
        >
          Manifesto
        </Button>
        <Button
          size="small"
          color="primary"
          href="https://github.com/tracking-exposed/yttrex/"
          target="_blank"
        >
          Software
        </Button>
        <Button
          size="small"
          color="secondary"
          href={guardonihref}
          target="_blank"
        >
          Guardoni
        </Button>
      </CardActions>
    </Card>
  );
};

export default InfoBox;
