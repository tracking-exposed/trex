import moment from 'moment';
import React from 'react';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ImageIcon from '@material-ui/icons/Image';
import WorkIcon from '@material-ui/icons/Work';
import BeachAccessIcon from '@material-ui/icons/BeachAccess';


class SearchedTerm extends React.Component{

  render () {

    const term = this.props.term;
    const amount = this.props.amount;
    const totalVideos = this.props.totalVideos;
    const S = amount + " evidences, (" + totalVideos + " videos)";

    return (
      <ListItem>
        <ListItemAvatar>
          <Avatar>
            <WorkIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={term} secondary={S} />
      </ListItem>
    );
  }
}

export default SearchedTerm;