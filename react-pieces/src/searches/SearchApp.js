import moment from 'moment';
import React from 'react';

import { Card } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import FormHelperText from '@material-ui/core/FormHelperText';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import BeachAccessIcon from '@material-ui/icons/BeachAccess';


import SearchedTerm from './SearchedTerm';

const styles = {
  width: '400px',
};

const LOCALHOST_SERVER = 'http://localhost:9000';

function getSearchPatterns(paging) {
  if (paging) console.log("remember the paging is disabled");
  if (window.location.origin.match(/localhost/))
    return `${LOCALHOST_SERVER}/api/v2/search/keywords/`;
  return `/api/v2/search/keywords/`;
}

function getSearchesResults(term, paging) {
  if (paging) console.log("remember the paging is disabled");
  if (window.location.origin.match(/localhost/))
    return `${LOCALHOST_SERVER}/api/v2/searches/${term}/`;
  return `/api/v2/searches/${term}/`;
}

class SearchApp extends React.Component{

  constructor (props) {
    super(props);
    this.state = { status: 'fetching' };
  }

  componentDidMount () {
    const url = getSearchPatterns();
    fetch(url, { mode: 'cors' })
      .then(resp => resp.json())
      .then(data => this.setState({status: 'done', data }));
  }

  render () {

    if(!this.state || this.state.status == 'fetching')
      return (<div>Loading recent search terms...</div>)

    console.log('X: props status', this.props, this.state);

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

    const selist = _.get(this.state.data, 'selist');

    if(!(this.state.data && selist && selist.length > 1 )) {
      return (
        <div style={styles}>
          <Card>
            <h1>Altought connection with server worked, no search terms seems available, <a href="https://www.youtube.com/watch?v=bs2u4NLaxbI">wtf</a>.</h1>
          </Card>
        </div>
      );
    }
    
    const items = []

    for (const sevid of selist ) {
      // sevid.id it is a list temporarly ignored, maybe usable in advanced searches
      console.log(sevid);
      items.push(<SearchedTerm
        term={sevid.t}
        amount={sevid.amount}
        totalVideos={sevid.searches}
        key={_.random(0, 0xffff) } /> 
      );
      items.push(<Divider variant="inset" component="li" />);

    }

    return (
      <div style={styles}>
        <Card>
          <FormHelperText>
            Recent searches recorded
          </FormHelperText>
          <List>
            {items}
          </List>
        </Card>
      </div>
    );
  }
}

export default SearchApp;
