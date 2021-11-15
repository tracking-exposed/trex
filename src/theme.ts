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
