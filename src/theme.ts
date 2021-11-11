import { createTheme } from '@material-ui/core/styles';

const pink = '#E33180';
const green = '#017374';
const white = '#FFFFFF';

export const YCAITheme = createTheme({
  typography: {
    fontFamily: 'Trex',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 800,
    h1: {
      marginBottom: 30,
      fontSize: '1.75rem',
    },
    h2: {
      marginBottom: 25,
      fontSize: '1.60rem',
    },
    h3: {
      marginBottom: 20,
      fontSize: '1.45rem',
    },
    h4: {
      marginBottom: 18,
      fontSize: '1.30rem',
    },
    h5: {
      marginBottom: 16,
      fontSize: '1.15rem',
    },
    h6: {
      marginBottom: 14,
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
    background: {
      default: white,
    },
    primary: {
      light: '#FF338F',
      main: pink,
      dark: '#C9065E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: green,
      main: green,
      dark: green,
      contrastText: white,
    },
  },
});

export type YCAITheme = typeof YCAITheme;
