import { Button, CardActions } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getYTThumbnailById } from 'utils/yt.utils';


interface VideoCardProps {
  videoId: string;
  title: string;
  onClick?: (id: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  videoId,
  title,
  onClick,
}) => {
  const { t } = useTranslation();
  return (
    <Card
      style={{
        textAlign: 'left',
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
            <a
              href={'https://youtu.be/' + videoId}
              target="_blank"
              rel="noreferrer"
            >
              {title}
            </a>
          </Typography>
          <a
            target="_blank"
            rel="noreferrer"
            href={'https://youtube.tracking.exposed/compare/#' + videoId}
          >
            {t('actions:compare')}
          </a>{' '}
          —{' '}
          <a
            target="_blank"
            rel="noreferrer"
            href={'https://youtube.tracking.exposed/related/#' + videoId}
          >
            {t('actions:related')}
          </a>
        </CardContent>
        <CardActions>
          {onClick !== undefined ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => onClick(videoId)}
            >
              {t('actions:editThisVideo')}
            </Button>
          ) : null}
        </CardActions>
      </CardActionArea>
    </Card>
  );
};
