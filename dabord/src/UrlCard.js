import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

// import config from '../../config';


class UrlCard extends React.Component{

  constructor (props) {
    super(props);
    if(this.props.data) {
      // console.log("Setting state", this.props.data);
      this.setState({data: this.props.data});
    }
  }

  render () {
    // console.log("Props:", this.props, "State:", this.state);

    if(this.props.fetch)
      return (<i>Fetching data...</i>);

    const data = this.props.data;

    return (
      <Card
        style={{
          textAlign:"left",
          /* width:"200px", */
          margin:"6px"
        }}>
        <CardActionArea>
          { data.image ?
            <CardMedia
              component="img"
              style={{ height: "120px", paddingTop: "2%" }}
              src={data.image}
              title={data.title}
            /> : <small>🗲<code>𝕟𝕠 𝕡𝕚𝕔𝕥𝕦𝕣𝕖</code></small>
          }
          <CardContent>
            <Typography
              gutterBottom
              variant="h5"
              component="h4">
              {data.title}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              component="small">
              {data.description}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
}

export default UrlCard;