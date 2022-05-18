import * as React from 'react';
import { AutoRotatingCarousel } from 'material-auto-rotating-carousel';
import Slide from './carousel/Slide';
import { Box, Button, makeStyles } from '@material-ui/core';
import { red, green, blue } from '@material-ui/core/colors';

const useStyles = makeStyles(() => ({
  root: {
    '& > *:focus': {},
  },
  content: {},
  contentMobile: {
    '& > $carouselWrapper': {},
  },
  arrow: {},
  arrowLeft: {},
  arrowRight: {},
  arrowIcon: {},
  carouselWrapper: {
    borderRadius: 0,
  },
  dots: {},
  dotsMobile: {},
  dotsMobileLandscape: {},
  footer: {},
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
          <img src="http://www.icons101.com/icon_png/size_256/id_79394/youtube.png" />
        }
        mediaBackgroundStyle={{ backgroundColor: red[400] }}
        style={{ backgroundColor: red[600] }}
        title="This is a very cool feature"
        subtitle="Just using this will blow your mind."
      />
      <Slide
        media={
          <img src="http://www.icons101.com/icon_png/size_256/id_80975/GoogleInbox.png" />
        }
        mediaBackgroundStyle={{ backgroundColor: blue[400] }}
        style={{ backgroundColor: blue[600] }}
        title="Ever wanted to be popular?"
        subtitle="Well just mix two colors and your are good to go!"
      />
      <Slide
        media={
          <img src="http://www.icons101.com/icon_png/size_256/id_76704/Google_Settings.png" />
        }
        mediaBackgroundStyle={{ backgroundColor: green[400] }}
        style={{ backgroundColor: green[600] }}
        title="May the force be with you"
        subtitle="The Force is a metaphysical and ubiquitous power in the Star Wars fictional universe."
      >
        <Box>
          <Button
            variant="contained"
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
