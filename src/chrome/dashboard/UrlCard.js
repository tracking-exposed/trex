import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

import config from '../../config';

class UrlCard extends React.Component{

  constructor (props) {
    super(props);
    if(this.props.data) 
      this.setState({data: this.props.data});
  }

  componentDidMount() {
    if(this.props.fetch && this.props.url && this.props.url.length > 8) {
      const p = encodeURIComponent(this.props.url);
      const ycurl = config.API_ROOT + '/ogp/' + p;
      fetch(ycurl)
        .then(resp => resp.json())
        .then(data => this.setState({
          data, success: true
        }))
        .catch(error => this.setState({
          error, success: false
        }));
    }
  }

  render () {
    console.log(this.props, this.state);

    if(this.props.fetch && !this.state)
      return (<i>fetching...</i>);

    if(!this.state.data || !this.state.data.title)
      return (<i>Error!</i>);

    return (
      <Card style={{
          textAlign:"left",
          width:"300px",
          margin:"6px"
      }}>
        <CardActionArea>
          <CardMedia
            component="img"
            style={{ height: "250px", paddingTop: "2%" }}
            src={this.state.data.image}
            title={this.state.data.title}
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              {this.state.data.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {this.state.data.description}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
}

/*
        <CardActions>
          <Button size="small" color="primary">
            Share
          </Button>
          <Button size="small" color="primary">
            Learn More
          </Button>
        </CardActions>
*/

export default UrlCard;