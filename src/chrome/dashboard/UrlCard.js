import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

class UrlCard extends React.Component{

  constructor (props) {
    super(props);
  }

  render () {
    console.log(this.props)
    console.log(this.props.data.image)

    return (
      <Card style={{textAlign:"left", width:"300px", margin:"6px"}}>
        <CardActionArea>
          <CardMedia
            image={this.props.data.image}
            title="Contemplative Reptile"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              {this.props.data.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {this.props.data.description}
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