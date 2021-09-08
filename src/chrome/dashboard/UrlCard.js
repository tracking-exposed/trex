import { Button, CardActions } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import React from 'react';

class UrlCard extends React.Component {
  render () {
    const { data, onAddClick } = this.props;

    return (
      <Card
        style={{
          textAlign: 'left',
          margin: '6px'
        }}
      >
        <CardActionArea>
          {data.image ? (
            <CardMedia
              component="img"
              style={{ height: '120px', paddingTop: '2%' }}
              src={data.image}
              title={data.title}
            />
          ) : (
            <small>
              🗲<code>𝕟𝕠 𝕡𝕚𝕔𝕥𝕦𝕣𝕖</code>
            </small>
          )}
          <CardContent>
            <Typography gutterBottom variant="h5" component="h4">
              {data.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="small">
              {data.description}
            </Typography>
          </CardContent>
        </CardActionArea>
        {onAddClick ? (
          <CardActions>
            <Button
              size="small"
              onClick={() => {
                onAddClick();
              }}
            >
              Add to current video
            </Button>
          </CardActions>
        ) : null}
      </Card>
    );
  }
}

export default UrlCard;
