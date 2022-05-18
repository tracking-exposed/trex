import React from 'react';
import { Typography, Box, makeStyles } from '@material-ui/core';
import blue from '@material-ui/core/colors/blue';
import classNames from 'classnames';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: blue[500],
    height: '100%',
  },
  rootMobile: {},
  rootMobileLandscape: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
  },
  media: {
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& > *': {
      maxHeight: '100%',
    },
  },
  mediaMobile: {
    position: 'relative',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  mediaMobileLandscape: {},
  mediaBackground: {
    backgroundColor: blue[700],
    height: 'calc(100% - 216px)',
    textAlign: 'center',
  },
  mediaBackgroundMobile: {
    height: 'calc(100% - 241px)',
  },
  mediaBackgroundMobileLandscape: {
    height: '100%',
    flex: '1 1',
    alignSelf: 'stretch',
  },
  text: {
    textAlign: 'center',
    maxWidth: '80%',
    margin: '0 auto',
    paddingTop: 32,
  },
  textMobile: {
    paddingTop: 30,
    '& $title': {
      marginBottom: 8,
    },
  },
  textMobileLandscape: {
    minWidth: 300,
    maxWidth: 'calc(50% - 48px)',
    padding: '24px 24px 128px',
    flex: '0 1',
    alignSelf: 'center',
    textAlign: 'left',
    margin: 0,
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '32px',
    marginBottom: 12,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    color: '#fff',
  },
  subtitle: {
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: '18px',
    margin: 0,
    color: '#fff',
  },
}));

interface SlideProps {
  /**
   * Outer wrapper style
   */
  style?: React.CSSProperties;
  /**
   * Object to display in the upper half.
   */
  media: React.ReactNode;
  /**
   * Override the inline-styles of the media container.
   */
  mediaBackgroundStyle: React.CSSProperties;
  /**
   * Subtitle of the slide.
   */
  subtitle: string;
  /**
   * Title of the slide.
   */
  title: string;
  /**
   * If `true`, the screen width and height is filled.
   */
  mobile?: boolean;
  /**
   * If `true`, slide will adjust content for wide mobile screens.
   */
  landscape?: boolean;
}

const Slide: React.FC<SlideProps> = ({ children, ...props }) => {
  const {
    media,
    mediaBackgroundStyle,
    subtitle,
    title,
    mobile,
    landscape,
    ...other
  } = props;

  const classes = useStyles();
  const mobileLandscape = mobile && landscape;

  return (
    <div
      className={classNames(classes.root, {
        [classes.rootMobile]: mobile,
        [classes.rootMobileLandscape]: mobileLandscape,
      })}
      {...other}
    >
      <div
        className={classNames(classes.mediaBackground, {
          [classes.mediaBackgroundMobile]: mobile,
          [classes.mediaBackgroundMobileLandscape]: mobileLandscape,
        })}
        style={mediaBackgroundStyle}
      >
        <div
          className={classNames(classes.media, {
            [classes.mediaMobile]: mobile,
            [classes.mediaMobileLandscape]: mobileLandscape,
          })}
        >
          {media}
        </div>
      </div>
      <div
        className={classNames(classes.text, {
          [classes.textMobile]: mobile,
          [classes.textMobileLandscape]: mobileLandscape,
        })}
      >
        <Typography className={classes.title}>{title}</Typography>
        <Typography className={classes.subtitle}>{subtitle}</Typography>
        <Box>{children}</Box>
      </div>
    </div>
  );
};

export default Slide;
