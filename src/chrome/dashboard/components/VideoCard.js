import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

const getYTThumbnailById = (id) => `https://i.ytimg.com/vi/${id}/hq720.jpg`;

export class VideoCard extends React.Component {
  render () {
    const { title, id } = this.props;
    return (
      <Card
        style={{
          textAlign: 'left',
          /* width:"200px", */
          margin: '6px'
        }}
        onClick={() => this.props.onClick(id)}
      >
        <CardActionArea>
          <CardMedia
            component="img"
            style={{ height: '120px', paddingTop: '2%' }}
            src={getYTThumbnailById(id)}
            title={title}
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h4">
              {title}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
}
