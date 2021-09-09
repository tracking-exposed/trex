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
      onClick={() => onClick(videoId)}
    >
      <CardActionArea>
        <CardMedia
          component="img"
          style={{ height: '120px', paddingTop: '2%' }}
          src={getYTThumbnailById(videoId)}
          title={title}
        />
        <CardContent>
          <a href={"https://youtube.tracking.exposed/compare/#" + videoId}>
            Cmp
          </a> — <a href={"https://youtube.tracking.exposed/related/#" + videoId}>
            Rel
          </a> 
          <Typography gutterBottom variant="h5" component="h4">
            <a href={"https://youtu.be/" + videoId} target="_blank">
              {title}
            </a>
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
