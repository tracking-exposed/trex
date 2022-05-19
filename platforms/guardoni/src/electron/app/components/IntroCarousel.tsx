import * as React from 'react';
import { AutoRotatingCarousel } from 'material-auto-rotating-carousel';
import Slide from './carousel/Slide';
import { Box, Button, makeStyles } from '@material-ui/core';
import { deepPurple, green } from '@material-ui/core/colors';

const useStyles = makeStyles(() => ({
  root: {
    '& > *:focus': {},
  },
  content: {},
  contentMobile: {
    '& > $carouselWrapper': {},
  },
  arrow: {
    boxShadow: 'none',
    backgroundColor: 'transparent',
    '&:hover': {
      background: 'transparent',
      border: 'solid black 2.5px',
      transition: 'none',
    },
  },
  arrowLeft: {},
  arrowRight: {},
  arrowIcon: {
    color: '#fff',
  },
  carouselWrapper: {
    borderRadius: 0,
  },
  dots: {},
  dotsMobile: {},
  dotsMobileLandscape: {},
  footer: {
    marginTop: 0,
  },
  footerMobile: {},
  footerMobileLandscape: {},
  slide: {
    width: '100%',
    height: '100%',
  },
  slideMobile: {
    width: '100%',
    height: '100%',
  },
  carousel: {
    height: '100%',
  },
  carouselContainer: {
    height: '100%',
  },
  closed: {},
}));

interface IntroCarouselProps {
  open: boolean;
  onCTAClick: () => void;
}

export const IntroCarousel: React.FC<IntroCarouselProps> = ({
  open,
  onCTAClick,
}) => {
  const classes = useStyles();

  return (
    <AutoRotatingCarousel
      classes={classes}
      autoplay={false}
      open={open}
      containerStyle={{ borderRadius: 0 }}
    >
      <Slide
        media={
          <img src="https://www.icons101.com/icon_png/size_256/id_67379/Clone.png" />
        }
        mediaBackgroundStyle={{ backgroundColor: '#23AA9A' }}
        style={{ backgroundColor: '#1b8074', border: 'solid black 2px' }}
        title="Welcome on Guardoni"
        subtitle="With this tool you can run experiments on web platforms and collect data about their behaviour."
      />
      <Slide
        media={
          <img src="https://www.icons101.com/icon_png/size_256/id_84012/json.png" />
        }
        mediaBackgroundStyle={{ backgroundColor: deepPurple[300] }}
        style={{ backgroundColor: deepPurple[600], border: 'solid black 2px' }}
        title="Anonymous tokens"
        subtitle="A private token will be generated. Experiments need some time to run, when finished you'll get JSON results."
      />
      <Slide
        media={
          <img src="https://www.icons101.com/icon_png/size_256/id_67377/C3po.png" />
        }
        mediaBackgroundStyle={{ backgroundColor: green[300] }}
        style={{ backgroundColor: green[600], border: 'solid black 2px' }}
        title="Privacy by design"
        subtitle="Read our Terms of Service and Privacy Policy."
      >
        <Box>
          <Button
            variant="contained"
            style={{ marginTop: '2em' }}
            onClick={() => {
              onCTAClick();
            }}
          >
            Start using guardoni
          </Button>
        </Box>
      </Slide>
    </AutoRotatingCarousel>
  );
};
