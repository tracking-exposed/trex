declare module 'material-auto-rotating-carousel' {
  interface AutoRotatingCarouselProps {
    classes?: any;
    autoplay?: boolean;
    open: boolean;
    containerStyle?: React.CSSProperties;
  }

  export class AutoRotatingCarousel extends React.Component<AutoRotatingCarouselProps> {}
  export class Slide extends React.Component<> {}
}
