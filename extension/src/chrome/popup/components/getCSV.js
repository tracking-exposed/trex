import React from 'react';
import config from '../../../config';

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import StayCurrentLandscapeIcon from '@material-ui/icons/StayCurrentLandscape';
import OndemandVideoIcon from '@material-ui/icons/OndemandVideo';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import List from '@material-ui/core/List';

function ListItemLink(props) {
    return <ListItem component="a" {...props} />;
}

class InfoBox extends React.Component{

    render () {
        const homecsv = config.API_ROOT + '/personal/' + this.props.publicKey + '/home' + '/csv';
        const videocsv = config.API_ROOT + '/personal/' + this.props.publicKey + '/video' + '/csv';
        const personalLink = config.WEB_ROOT + '/personal/#' + this.props.publicKey;

        return (
          <List component="nav" aria-label="controls links files">

            <ListItem button>
              <ListItemIcon>
                <AccountBoxIcon />
              </ListItemIcon>
              <ListItemLink href={personalLink} target="_blank">Personal page</ListItemLink>
            </ListItem>

            <ListItem button>
              <ListItemIcon>
                <StayCurrentLandscapeIcon />
              </ListItemIcon>
              <ListItemLink href={homecsv} target="_blank">Download Homepage Video CSV</ListItemLink>
            </ListItem>

            <ListItem button>
              <ListItemIcon>
                <OndemandVideoIcon />
              </ListItemIcon>
              <ListItemLink href={videocsv} target="_blank">Download Related Video CSV</ListItemLink>
            </ListItem>

          </List>
        );
    }
};

export default InfoBox;
