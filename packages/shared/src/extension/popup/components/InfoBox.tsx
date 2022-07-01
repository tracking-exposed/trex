import React from 'react';
import config from '../../config';
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

const InfoBox: React.FC<{ logo: string }> = ({ logo }) => {
  const about = config.WEB_ROOT + '/about';
  const privacy = config.WEB_ROOT + '/privacy';
  // const services = config.WEB_ROOT + '/services';
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
        <img style={imgstyle} src={logo} />
      </a>
      <CardActions>
        <Button size="small" color="secondary" href={about} target="_blank">
          Project
        </Button>
        <Button
          size="small"
          color="secondary"
          href="https://tracking.exposed/manifesto"
          target="_blank"
        >
          Manifesto
        </Button>
        <Button size="small" color="primary" href={code} target="_blank">
          Software
        </Button>
        <Button color="primary" href={privacy} target="_blank">
          Privacy
        </Button>
        <Button color="secondary" href={docs} target="_blank">
          Documentation
        </Button>
      </CardActions>
    </Card>
  );
};

export default InfoBox;
