import {
  createTheme,
  lighten,
  darken,
  ThemeProvider,
  useTheme,
  makeStyles,
} from '@material-ui/core/styles';

const pink = '#E33180';
const lightPink = lighten(pink, .2)
const darkPink = darken(pink, .2);
const grey = '#5B5F6F';
const yellow = '#DA9D00';
const violet = '#572B8F';
const lightViolet = lighten(violet, 0.2);
const darkViolet = darken(violet, 0.2);
const white = '#F5F5F5';
const black = '1A030E';

export const YCAITheme = createTheme({
  typography: {
    fontFamily: 'Trex',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 800,
    h1: {
      marginBottom: 32,
      fontSize: '1.75rem',
    },
    h2: {
      marginBottom: 16,
      fontSize: '1.35rem',
    },
    h3: {
      marginBottom: 12,
      fontSize: '1.15rem',
    },
    h4: {
      marginBottom: 8,
      fontSize: '1.10rem',
    },
    h5: {
      marginBottom: 4,
      fontSize: '1.05rem',
    },
    h6: {
      marginBottom: 4,
      fontSize: '1rem',
    },
  },
  overrides: {
    MuiTabs: {
      root: {
        background: pink,
      },
    },
  },
  palette: {
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
      contrastText: white
    },
    yellow: {
      light: yellow,
      main: yellow,
    },
    grey: {
      500: grey,
    },
  },
});

export type YCAITheme = typeof YCAITheme;

export { makeStyles, ThemeProvider, useTheme };
