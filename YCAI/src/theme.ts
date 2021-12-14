import {
  createTheme,
  lighten,
  darken,
  ThemeProvider,
  useTheme,
  alpha,
  makeStyles,
} from '@material-ui/core/styles';

const pink = '#E33180';
const lightPink = lighten(pink, 0.2);
const darkPink = darken(pink, 0.2);
const grey = '#5B5F6F';
const lightGrey = alpha(grey, 0.2);
const darkGrey = darken(grey, 0.2);
const yellow = '#DA9D00';
const violet = '#572B8F';
const lightViolet = lighten(violet, 0.2);
const darkViolet = darken(violet, 0.2);
const white = '#F5F5F5';
const black = '#1A030E';

export const YCAITheme = createTheme({
  typography: {
    fontSize: 16,
    fontFamily: 'Trex',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 800,
    h1: {
      fontWeight: 800,
      fontSize: '4rem',
      marginBottom: 32,
    },
    h2: {
      fontWeight: 800,
      fontSize: '3.6rem',
      marginBottom: 16,
    },
    h3: {
      fontWeight: 800,
      fontSize: '1.8rem',
      marginBottom: 10,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.6rem',
      marginBottom: 8,
    },
    h5: {
      fontWeight: 800,
      fontSize: '1.3rem',
    },
    h6: {
      fontWeight: 400,
      fontSize: '1.1rem',
      marginBottom: 4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 300,
      lineHeight: 1.4,
      marginBottom: 20,
    },
    subtitle2: {
      fontSize: '0.9rem',
      fontWeight: 800,
      lineHeight: 1.1,
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.1,
      color: black,
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.8rem',
      lineHeight: 1.2,
    },
    caption: {
      fontSize: '0.7rem',
      lineHeight: 1.3,
    },
  },
  overrides: {
    MuiTabs: {
      root: {
        background: pink,
      },
    },
    MuiButton: {
      sizeSmall: {
        fontSize: '0.7rem',
      },
      contained: {
        color: grey,
        backgroundColor: lightGrey,
      },
      containedPrimary: {
        color: white,
      },
      containedSecondary: {
        color: white,
        background: grey,
      },
    },
    MuiTypography: {
      root: {
        whiteSpace: 'pre-wrap',
      }
    }
  },
  palette: {
    text: {
      primary: grey,
      secondary: black,
    },
    common: {
      white: white,
      black: black,
    },
    background: {
      default: white,
    },
    primary: {
      light: lightPink,
      main: pink,
      dark: darkPink,
      contrastText: white,
    },
    secondary: {
      light: lightViolet,
      main: violet,
      dark: darkViolet,
      contrastText: white,
    },
    violet: {
      light: violet,
      main: violet,
      dark: darkViolet,
      contrastText: white,
    },
    yellow: {
      light: yellow,
      main: yellow,
    },
    grey: {
      300: lightGrey,
      500: grey,
      800: darkGrey,
    },
  },
});

export type YCAITheme = typeof YCAITheme;

export { makeStyles, ThemeProvider, useTheme };
