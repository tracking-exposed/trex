import React from 'react';
import _ from 'lodash';
import { Card } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import FormHelperText from '@material-ui/core/FormHelperText';

import config from '../../config';
import UrlCard from './UrlCard';
import { getVideoId } from '../../youtube';

const styles = {
  width: '400px',
  textAlign: 'left',
};

function getRecommendations(paging) {
  if (paging)
    console.log("remember the paging is disabled");
  // const videoId = getVideoId(window.location.href)
  const publicKey = "not-implemented-yet";
  return `${config.API_ROOT}/profile/recommendations/${publicKey}`;
}

class Recommendations extends React.Component{

  constructor (props) {
    super(props);
    this.state = { status: 'fetching' };
  }

  componentDidMount () {
    const url = getRecommendations();
    fetch(url, { mode: 'cors' })
      .then(resp => resp.json())
      .then(data => this.setState({status: 'done', data }));
  }

  render () {

    if(!this.state || this.state.status == 'fetching')
      return (<div>Loading the most recently performed searches...</div>)

    console.log('checking state:', this.state);

    if(this.state.status !== 'done') {
      console.log("Incomplete info before render");
      return (
        <div style={styles}>
          <Card>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              Server didn't return data, this might means the backend is down — <strong>Make sense also because this is just an experiment in prototype phase.</strong>
            </Alert>
          </Card>
        </div>
      );
    }

    const selist = this.state.data;

    if(!(this.state.data && selist && selist.length )) {
      return (
        <div style={styles}>
          <Card>
            <h1>Altought connection with server worked, no content was available: <a href="https://www.youtube.com/watch?v=bs2u4NLaxbI">ODD?</a>.</h1>
          </Card>
        </div>
      );
    }
    
    return (
      <span>
        <div style={styles}>
          <Card>
            <FormHelperText>
              This please is helpful to test ways to visualize recommendation in React, and then later import this into YoutubeUX.
            </FormHelperText>
          </Card>
        </div>
        <div className="card-group">
          {selist.map((item,i) => <UrlCard key={i} data={item} />)}
        </div>
      </span>
    );
  }
}

export default Recommendations;