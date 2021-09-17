import { Button, CardActions } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import React from 'react';

const getYTThumbnailById = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const VideoCard = ({ videoId, title, onClick }) => {
  return (
    <Card
      style={{
        textAlign: 'left',
        /* width:"200px", */
        margin: '6px',
      }}
    >
      <CardActionArea>
        <CardMedia
          component="img"
          style={{ height: '120px', paddingTop: '2%' }}
          src={getYTThumbnailById(videoId)}
          title={title}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="h4">
            <a href={'https://youtu.be/' + videoId} target="_blank" rel="noreferrer">
              {title}
            </a>
          </Typography>
          <a
            target="_blank"
            rel="noreferrer"
            href={'https://youtube.tracking.exposed/compare/#' + videoId}
          >
            Compare
          </a>{' '}
          —{' '}
          <a
            target="_blank"
            rel="noreferrer"
            href={'https://youtube.tracking.exposed/related/#' + videoId}
          >
            Related
          </a>
        </CardContent>
        <CardActions>
          {onClick ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => onClick(videoId)}
            >
              Edit this video
            </Button>
          ) : null}
        </CardActions>
      </CardActionArea>
    </Card>
  );
};
