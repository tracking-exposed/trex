import React from 'react';
import config from '../../../config';
import createReactClass from 'create-react-class';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/Inbox';
import DraftsIcon from '@material-ui/icons/Drafts';


function ListItemLink(props) {
  return <ListItem button component="a" {...props} />;
}

const InfoBox = createReactClass({

    render () {
        const homecsv = config.API_ROOT + '/api/v1/personal/' + this.props.publicKey + 'home' + '/csv'
        const videocsv = config.API_ROOT + '/api/v1/personal/' + this.props.publicKey + 'video' + '/csv'

        return (
            <List component="nav" aria-label="main mailbox folders">
              <ListItem button>
                <ListItemIcon>
                  <InboxIcon />
                </ListItemIcon>
                <ListItemText primary="Download related Videos (CSV)" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <DraftsIcon />
                </ListItemIcon>
                <ListItemText primary="Download homepage Videos (CSV)" />
              </ListItem>
            </List>
        );

    }
});

export default InfoBox;
